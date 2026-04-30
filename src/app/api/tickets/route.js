import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const ownerFilter = session?.role === 'admin' ? {} : { createdBy: session?.userId ?? null }
    const tickets = await prisma.ticket.findMany({
      where: {
        ...ownerFilter,
        ...(search ? {
          OR: [
            { driverLicenseNumber: { contains: search, mode: 'insensitive' } },
            { driverLastName: { contains: search, mode: 'insensitive' } },
            { citationNumber: { contains: search, mode: 'insensitive' } },
            { vinNumber: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { violationDate: 'desc' },
    })
    return NextResponse.json(tickets)
  } catch (err) {
    console.error('[GET /api/tickets]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function toDate(val) {
  if (!val || val === '') return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

export async function POST(request) {
  try {
    const session = await getSession()
    const body = await request.json()
    const { createdBy: _ignored, violationDate, citationDate, ...safeBody } = body
    const ticket = await prisma.ticket.create({
      data: {
        ...safeBody,
        violationDate: toDate(violationDate),
        citationDate: toDate(citationDate),
        createdBy: session?.userId ?? null,
      },
    })
    return NextResponse.json(ticket, { status: 201 })
  } catch (err) {
    console.error('[POST /api/tickets]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
