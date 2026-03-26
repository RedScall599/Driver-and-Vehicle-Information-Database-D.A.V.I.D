import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function generateTicketId() {
  const num = Math.floor(Math.random() * 9000) + 1000
  return `TIN-${num}`
}

export async function GET() {
  try {
    const requests = await prisma.serviceRequest.findMany({
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
    const sr = await prisma.serviceRequest.create({ data: body })
    return NextResponse.json(sr, { status: 201 })
  } catch (err) {
    console.error('[POST /api/service-requests]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
