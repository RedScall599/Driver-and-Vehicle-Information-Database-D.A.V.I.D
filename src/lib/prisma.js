import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

const globalForPrisma = globalThis

function getPrismaClient() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma

  // All code execution is deferred here — imports above only bind values,
  // nothing runs at module evaluation time
  neonConfig.webSocketConstructor = ws

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  const client = new PrismaClient({ adapter })

  globalForPrisma.prisma = client
  return client
}

export const prisma = new Proxy({}, {
  get(_, prop) {
    return getPrismaClient()[prop]
  },
})
