import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis

function getPrismaClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  const client = new PrismaClient({ adapter })
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client
  }
  return client
}

// Proxy defers instantiation until first use — safe during Vercel build phase
export const prisma = new Proxy({}, {
  get(_, prop) {
    return getPrismaClient()[prop]
  },
})
