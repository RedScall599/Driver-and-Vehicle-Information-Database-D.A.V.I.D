const globalForPrisma = globalThis

function getPrismaClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  // Dynamic requires keep these out of module-evaluation scope
  // so Vercel's build phase never tries to instantiate them
  const { neonConfig } = require('@neondatabase/serverless')
  const { PrismaNeon } = require('@prisma/adapter-neon')
  const { PrismaClient } = require('@prisma/client')
  const ws = require('ws')

  neonConfig.webSocketConstructor = ws

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  const client = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

// Proxy defers ALL instantiation until first runtime use
export const prisma = new Proxy({}, {
  get(_, prop) {
    return getPrismaClient()[prop]
  },
})
