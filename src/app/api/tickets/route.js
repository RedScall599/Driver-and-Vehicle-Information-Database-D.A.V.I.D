import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tickets = await prisma.ticket.findMany({
      where: search
        ? {
            OR: [
              { driverLicenseNumber: { contains: search, mode: 'insensitive' } },
              { driverLastName: { contains: search, mode: 'insensitive' } },
              { citationNumber: { contains: search, mode: 'insensitive' } },
              { vinNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { violationDate: 'desc' },
    })
    return NextResponse.json(tickets)
  } catch (err) {
    console.error('[GET /api/tickets]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const ticket = await prisma.ticket.create({ data: body })
    return NextResponse.json(ticket, { status: 201 })
  } catch (err) {
    console.error('[POST /api/tickets]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
