import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

function toDate(val) {
  if (!val || val === '') return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
    })
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && ticket.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(ticket)
  } catch (err) {
    console.error('[GET /api/tickets/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.ticket.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && existing.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { createdBy: _ignored, id: _id, createdAt: _ca, updatedAt: _ua, driver: _driver, vehicle: _vehicle, documents: _docs, violationDate, citationDate, ...safeBody } = body
    const ticket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: {
        ...safeBody,
        violationDate: toDate(violationDate),
        citationDate: toDate(citationDate),
      },
    })
    return NextResponse.json(ticket)
  } catch (err) {
    console.error('[PUT /api/tickets/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const existing = await prisma.ticket.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && existing.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.ticket.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/tickets/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
