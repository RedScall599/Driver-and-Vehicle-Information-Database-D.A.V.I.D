# D.A.V.I.D. — Deployment Notes & Future Planning

## Overview

This document summarizes what went wrong during development and deployment of D.A.V.I.D. (Driver and Vehicle Information Database), what approaches worked well, and a forward plan for migrating the infrastructure to AWS for improved security, control, and reliability.

---

## What Went Wrong

### 1. Vercel Cron Jobs (Hobby Plan Limitation)

**Problem:** The help desk escalation system was initially configured as a Vercel cron job in `vercel.json`:

```json
{
  "crons": [{ "path": "/api/helpdesk/escalate", "schedule": "*/5 * * * *" }]
}
```

Vercel's **Hobby plan does not allow cron jobs that run more frequently than once per day.** Every deployment was rejected with a cron configuration error.

**Fix:** Removed the cron entirely from `vercel.json` and replaced it with a background timer inside `src/instrumentation.js` — a Next.js server-side hook that runs when the server starts. This fires `runEscalation()` every 60 seconds internally without needing any external scheduler.

**Lesson:** Vercel Hobby plan has meaningful restrictions. Always check plan limits before designing features that depend on platform-specific services.

---

### 2. Vercel Build Crash — `prisma.js` Module Evaluation

**Problem:** Vercel's build phase evaluates all JavaScript modules before any environment variables exist. The original `prisma.js` was doing real work at module load time:

```js
// This all ran during the BUILD, not at runtime
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'
neonConfig.webSocketConstructor = ws                         // ← ran at build
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL }) // DATABASE_URL = undefined
const prisma = new PrismaClient({ adapter })                 // ← crashed
throw new Error('DATABASE_URL is not set')                   // ← also crashed
```

The build failed with:
```
Failed to collect page data for /api/accidents/[id]
```

**Attempts and outcomes:**

| Attempt | Change | Result |
|---|---|---|
| 1 | Removed `import 'dotenv/config'` and the `throw` | Still crashed — `neonConfig` assignment still ran at build |
| 2 | Made `prisma` a `Proxy` with deferred factory | Still crashed — ES `import` statements at top of file still triggered side effects |
| 3 | Moved all imports to `require()` inside the factory function | Build passed locally |
| 4 (final) | Reverted to clean ES `import` statements + moved ALL code execution inside a factory function + added `serverExternalPackages` to `next.config.mjs` | Build passed, runtime works |

**Root cause clarified:** ES `import` statements are static bindings — they don't execute code by themselves. It was the *statements like `neonConfig.webSocketConstructor = ws`* and `new PrismaClient(...)` running at module scope that caused the crash. Wrapping all of that inside a function that only fires on first DB call fixed it.

**Lesson:** On Vercel (and serverless in general), never run code at module scope that depends on environment variables or makes connections. Always defer to runtime.

---

### 3. Vercel Build Crash — `useSearchParams()` in Login Page

**Problem:** Next.js App Router requires `useSearchParams()` to be inside a `<Suspense>` boundary. The login page was calling it directly in the page component body, which caused:

```
useSearchParams() should be wrapped in a suspense boundary
```

**Fix:** Split the page into an inner `LoginForm` component (which uses `useSearchParams`) and an outer `LoginPage` wrapper that renders it inside `<Suspense>`:

```jsx
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
```

**Lesson:** Any component using `useSearchParams()` in the App Router must be inside `<Suspense>`. This is a hard requirement Vercel enforces at build time even if it works fine in dev.

---

### 4. Login Failing in Production — Prisma Client Not Generated

**Problem:** Even after fixing the build crash, login was returning `500` errors on Vercel. The cause was that the **Prisma generated client does not exist on Vercel** until it is explicitly generated.

`node_modules` is gitignored and not committed to source control. When Vercel runs `npm install`, it restores packages but does **not** automatically run `prisma generate` — meaning the `@prisma/client` package existed but had no generated types or query engine, making every database call fail silently with a runtime error.

**Fix:** Added a `postinstall` script to `package.json`:

```json
"postinstall": "prisma generate"
```

`npm install` always runs `postinstall` automatically after finishing, so Vercel now generates the Prisma client as part of every deployment.

**Lesson:** Any tool that generates code from a schema (Prisma, GraphQL codegen, etc.) needs a `postinstall` hook so generated files are created in CI/CD environments that don't have them committed.

---

### 5. Production Caching Bug — New DB Connection on Every Request

**Problem:** The Prisma singleton had a logic bug that explicitly disabled caching in production:

```js
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = client  // Only cached in dev!
}
return client  // In production: a brand new PrismaClient every call
```

This meant every single database query in production created a new `PrismaClient` instance and a new WebSocket connection to Neon, rapidly exhausting the connection pool and causing intermittent failures under any real load.

**Fix:** Removed the environment check — the client is now cached in all environments.

**Lesson:** Singleton patterns must work in production. The development-only caching pattern exists to prevent hot-reload from accumulating connections in `next dev` — it should never disable caching in production.

---

### 6. Missing Environment Variables on Vercel

**Problem:** `.env.local` is gitignored and never committed — correctly. But the first deployments to Vercel had no environment variables set at all, so every API call that touched the database or created a JWT token failed immediately.

**Required variables that were not set initially:**

- `DATABASE_URL` — Neon connection string
- `JWT_SECRET` — Secret for signing session tokens

**Fix:** Added all variables in Vercel Dashboard → Project → Settings → Environment Variables, then redeployed.

**Lesson:** Always set up environment variables in the deployment platform before the first live test. Create a checklist of all `process.env.*` references in the codebase.

---

## What Worked Well

### Next.js App Router + API Routes
Kept all frontend and backend in one repository with zero configuration for routing. API routes co-located with pages made the project easy to navigate and reason about.

### Prisma + Neon for Rapid Development
Prisma's schema-first approach (`schema.prisma`) made it fast to define the data model and generate type-safe queries. Neon's serverless PostgreSQL worked well for early development — free tier, instant provisioning, and native WebSocket support for serverless environments.

### `jose` for JWT Auth
Lightweight, zero-dependency JWT library. Works natively in Next.js middleware (Edge runtime) without polyfills. The sliding session pattern (refreshing the token on every request) was clean to implement via `middleware.js`.

### `src/instrumentation.js` for Background Jobs
Using Next.js's built-in instrumentation hook to run a recurring escalation check was a clean alternative to external cron services. No third-party scheduler needed, no platform restrictions.

### Seed Script (`prisma/seed.mjs`)
Having a complete seed script with realistic data made testing significantly faster. Any developer can clone the repo, run `npm run seed`, and immediately have a fully populated database to work with.

### Tailwind CSS
Utility-first styling kept the UI consistent and fast to build. No custom CSS files to maintain alongside component logic.

---

## Future Migration Plan: Vercel + Neon → AWS

The current setup works but has real limitations around control, security, cost predictability, and connectivity. Migrating to AWS resolves all of these.

### Why Migrate

| Concern | Current (Vercel + Neon) | AWS |
|---|---|---|
| **Database control** | Neon manages everything | Full control over PostgreSQL config, users, backups |
| **Network security** | DB accessible over public internet | DB in private VPC subnet, never public |
| **Secret management** | Env vars in Vercel dashboard | AWS Secrets Manager or Parameter Store |
| **File storage** | Vercel Blob (third-party, extra cost) | S3 (native, cheaper at scale) |
| **Compliance** | Limited audit trail | CloudTrail, VPC Flow Logs, full audit capability |
| **Cost predictability** | Per-function invocations, unpredictable | Reserved instances or flat EC2 billing |
| **Background jobs** | Instrumentation hack | Native cron via EventBridge, ECS tasks, or Lambda |

---

### Target AWS Architecture

```
                        Internet
                           │
                    ┌──────▼──────┐
                    │  CloudFront  │  (CDN + DDoS protection)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  App Server  │  EC2 (t3.small) or ECS Fargate
                    │  Next.js     │  inside Public Subnet
                    └──────┬──────┘
                           │  (Private subnet only)
                    ┌──────▼──────┐
                    │  PostgreSQL  │  RDS (db.t3.micro) in Private Subnet
                    │  (RDS)       │  No public IP
                    └─────────────┘

Supporting Services:
  - S3              → file/document storage (replaces Vercel Blob)
  - Secrets Manager → DATABASE_URL, JWT_SECRET, SMTP credentials
  - EventBridge     → scheduled escalation job (replaces instrumentation.js timer)
  - Lambda          → optional: run escalation as a proper scheduled function
  - IAM             → per-service roles, no shared credentials
  - VPC             → isolated network, security groups per tier
```

---

### Migration Steps

#### Phase 1 — Database (RDS PostgreSQL)

1. Provision an **RDS PostgreSQL** instance (`db.t3.micro` is sufficient to start) in a **private subnet** inside a VPC.
2. Create a **security group** that only allows traffic from the app server's security group — no public internet access.
3. Update `schema.prisma` — the `provider` is already `"postgresql"`, so no schema changes needed.
4. Update `DATABASE_URL` to the RDS endpoint connection string.
5. Run `prisma migrate deploy` against the new RDS instance.
6. Run the seed script if needed.
7. **Remove `@neondatabase/serverless`, `@prisma/adapter-neon`, and `ws`** from `package.json` — standard TCP connections replace WebSockets.
8. Simplify `prisma.js` back to a standard PrismaClient:

```js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

#### Phase 2 — App Server (EC2 or Fargate)

**Option A — EC2 (simpler, more direct control):**
1. Launch a `t3.small` Ubuntu instance in the **public subnet** of the same VPC.
2. Install Node.js 20, clone the repo, run `npm install && npm run build`.
3. Use **PM2** to keep `next start` running and restart on crash.
4. Use **Nginx** as a reverse proxy on port 80/443 → PM2 on port 3000.
5. Use **Certbot (Let's Encrypt)** or **ACM + ALB** for HTTPS.

**Option B — ECS Fargate (containerized, no server management):**
1. Add a `Dockerfile` to the project.
2. Push image to **ECR** (Elastic Container Registry).
3. Create an **ECS Fargate** service — AWS manages the underlying compute.
4. Attach an **Application Load Balancer** in front of it.

#### Phase 3 — Secrets Management

Replace Vercel environment variables with **AWS Secrets Manager**:

1. Store `DATABASE_URL`, `JWT_SECRET`, all SMTP credentials in Secrets Manager.
2. Grant the EC2 instance profile (or ECS task role) `secretsmanager:GetSecretValue` via IAM.
3. At app startup, fetch secrets programmatically — or use the **AWS Parameters and Secrets Lambda Extension** if using Fargate.

This means secrets are never stored as plaintext in any dashboard or config file.

#### Phase 4 — File Storage (S3)

Replace the current file upload destination with **S3**:

1. Create an S3 bucket with **Block Public Access** enabled.
2. Files are uploaded server-side using the AWS SDK (`@aws-sdk/client-s3`).
3. Files are served via **pre-signed URLs** (time-limited, authenticated) — never publicly accessible by default.
4. Update `src/app/api/upload/route.js` to use `PutObjectCommand` instead of the current storage target.

#### Phase 5 — Scheduled Escalation (EventBridge)

Replace the `instrumentation.js` background timer with a proper scheduled job:

1. Create an **EventBridge Scheduler** rule: `rate(1 minute)` or `cron(*/5 * * * ? *)`.
2. Target: an **AWS Lambda** function that calls the escalation logic, or a direct HTTP call to `/api/helpdesk/escalate` on the app server.
3. Delete `src/instrumentation.js` — no longer needed.

This is more reliable than a Node.js `setInterval` inside a serverless function, which can be killed between invocations.

---

### Estimated AWS Monthly Cost (Low Traffic / Internal Tool)

| Service | Tier | Estimated Cost |
|---|---|---|
| EC2 t3.small | On-Demand | ~$17/mo |
| RDS db.t3.micro (PostgreSQL) | Single-AZ | ~$15/mo |
| S3 | First 5 GB free | ~$0–$1/mo |
| Secrets Manager | Per secret | ~$0.40/mo |
| EventBridge | First 14M events free | ~$0/mo |
| CloudFront | First 1TB free | ~$0/mo |
| **Total** | | **~$33–$35/mo** |

Compare to Vercel Pro ($20/mo) + Neon Pro ($19/mo) = **$39/mo** with far less control and security.

---

### Security Improvements Gained on AWS

- **No public database endpoint** — RDS sits in a private subnet unreachable from the internet
- **IAM roles instead of API keys** — services authenticate via roles, no credentials to rotate or leak
- **VPC isolation** — app tier and DB tier are network-separated with security groups as the only bridge
- **CloudTrail** — full audit log of every API call and infrastructure change
- **AWS WAF** (optional, via CloudFront) — web application firewall to block common attacks
- **Secrets Manager rotation** — database passwords can be auto-rotated without code changes
- **Encryption at rest** — RDS and S3 both support AES-256 encryption enabled by default

---

*Document last updated: April 29, 2026*
