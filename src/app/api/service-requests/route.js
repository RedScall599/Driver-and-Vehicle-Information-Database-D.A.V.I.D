import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

function generateTicketId() {
  const num = Math.floor(Math.random() * 9000) + 1000
  return `TIN-${num}`
}

export async function GET() {
  try {
    const session = await getSession()
    const ownerFilter = session?.role === 'admin' ? {} : { createdBy: session?.userId ?? null }
    const requests = await prisma.serviceRequest.findMany({
      where: ownerFilter,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(requests)
  } catch (err) {
    console.error('[GET /api/service-requests]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    const body = await request.json()
    if (!body.ticketId) {
      let ticketId
      let exists = true
      while (exists) {
        ticketId = generateTicketId()
        exists = await prisma.serviceRequest.findUnique({ where: { ticketId } })
      }
      body.ticketId = ticketId
    }
    const { createdBy: _ignored, ...safeBody } = body
    const sr = await prisma.serviceRequest.create({ data: { ...safeBody, createdBy: session?.userId ?? null } })
    return NextResponse.json(sr, { status: 201 })
  } catch (err) {
    console.error('[POST /api/service-requests]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
