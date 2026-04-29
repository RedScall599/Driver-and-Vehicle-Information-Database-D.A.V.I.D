# D.A.V.I.D — Driver and Vehicle Information Database

A secure, web-based fleet and driver management system built for program administrators. D.A.V.I.D centralizes driver records, vehicle records, accident/violation tracking, service requests, and a help desk — all behind authenticated sessions with role-based access.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2.1 (App Router) |
| **Language** | JavaScript (JSX), React 19 |
| **Database** | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| **ORM** | Prisma 7 with `@prisma/adapter-neon` |
| **Authentication** | JWT (`jose`), bcryptjs, HTTP-only secure cookies |
| **Email** | Nodemailer over SMTP (Gmail or any SMTP provider) |
| **Styling** | Tailwind CSS 4 |
| **Deployment** | Vercel |

---

## Features

### Driver Management
- Create, view, edit, and search driver records
- Fields: name, program, license number, state, expiration, and license status (Valid / Suspended / Expired)
- Driver list highlights suspended drivers in red and expired drivers in yellow
- All fields required with client-side validation

### Vehicle Management
- Create, view, edit, and search vehicle records
- Fields: program vehicle, year, make, model, VIN, license plate, GPS tracker, IMEI, serial number, existing damages
- Associate vehicles with drivers

### Accidents & Violations
- Three-tab interface: data input, accidents list, tickets list
- Record accident details including police report info, insurance claim numbers, and adjuster assignments
- Record traffic citations with violation type and amounts

### Service Portal
- Submit and track vehicle maintenance and service requests
- Fields: issue type, request type, location, details
- Full edit and status tracking per request

### File Attachments
- Upload files to any record: drivers, vehicles, accidents, tickets, service requests
- Accepted: images (JPEG, PNG, GIF, WebP, HEIC), PDF, Word, Excel, TXT
- Max file size: 20 MB
- Files can be queued and uploaded during record creation (before the record is saved)
- Files stored in `public/uploads/` and tracked in the database with metadata

### Help Desk
- Unauthenticated ticket submission (anyone can submit without logging in)
- Fields: name, email, category, priority (Low / Normal / High / Urgent), subject, message
- Submitting a ticket automatically emails the primary support contact
- Email includes a one-click **Acknowledge** button that marks the ticket as seen and stops escalation
- If the ticket is not acknowledged within a configurable window (`HELPDESK_ESCALATE_MINUTES`, default 30), an escalation email is sent to the secondary contact
- Escalation runs on a background timer every 60 seconds — no external cron service required

### Authentication & Sessions
- Email/password signup and login with bcrypt-hashed passwords
- JWT sessions stored in an HTTP-only `david_session` cookie, valid for 30 minutes
- Sliding session: the token is refreshed on every request so active users stay logged in
- Inactivity timeout: admins are logged out after 30 minutes of inactivity; users after 10 minutes
- A warning is shown 1 minute before automatic logout

---

## Project Structure

```
src/
├── app/
│   ├── api/                  # REST API routes (auth, drivers, vehicles, accidents, tickets, upload, helpdesk)
│   ├── drivers/              # Driver list and detail pages
│   ├── vehicles/             # Vehicle list and detail pages
│   ├── accidents/            # Accidents and violations pages
│   ├── service-portal/       # Service request pages
│   ├── help-desk/            # Help desk submission form
│   ├── login/                # Sign in / sign up
│   └── page.jsx              # Dashboard home
├── components/
│   ├── AppShell.jsx          # Sidebar navigation layout
│   ├── AuthProvider.jsx      # Client-side user context
│   ├── FileAttachments.jsx   # Reusable file upload component
│   └── InactivityWatcher.jsx # Auto-logout on inactivity
├── lib/
│   ├── auth.js               # JWT creation and verification
│   ├── escalation.js         # Help desk escalation logic
│   ├── mailer.js             # Email sending (initial + escalation)
│   └── prisma.js             # Prisma client (Neon adapter)
├── middleware.js             # Session verification and token refresh on every request
└── instrumentation.js        # Background escalation timer (runs on server start)
prisma/
└── schema.prisma             # Database schema (User, Driver, Vehicle, Accident, Ticket, ServiceRequest, Document, HelpdeskTicket)
```

---

## Database Schema

| Model | Key Fields |
|---|---|
| `User` | id, email, name, passwordHash, role |
| `Driver` | id, firstName, lastName, program, licenseNumber, licenseState, licenseExpiration, licenseStatus |
| `Vehicle` | id, programVehicle, year, make, model, vinNumber, licensePlateNumber, gpsTracker, imeiNumber, serialNumber, existingDamages |
| `Accident` | id, driverInfo, accidentDate, vehicleInfo, policeReport, insuranceClaim, adjuster |
| `Ticket` | id, driverInfo, vehicleInfo, violationDate, citationNumber, citationType, citationAmount |
| `ServiceRequest` | id, ticketId, dateOfReport, issueWith, requestType, incidentLocation, details |
| `Document` | id, fileName, fileUrl, fileType, fileSize, linked record FKs |
| `HelpdeskTicket` | id, token, category, priority, name, email, subject, message, submittedAt, acknowledgedAt, escalatedAt |

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:pass@your-neon-host/db?sslmode=require

# JWT Secret (use a long random string)
JWT_SECRET=your-secret-here

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Help Desk
HELPDESK_PRIMARY=primary-support@example.com
HELPDESK_SECONDARY=escalation-contact@example.com
HELPDESK_ESCALATE_MINUTES=30

# App URL (used in email links)
APP_URL=https://your-domain.com
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Push the database schema
npx prisma db push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment

This project is configured for deployment on **Vercel**. Set all environment variables in the Vercel dashboard under Project → Settings → Environment Variables. Prisma's Neon adapter handles connection pooling automatically in serverless environments.

The help desk escalation timer runs automatically via Next.js `instrumentation.js` — no external cron service or Vercel cron job is needed.
