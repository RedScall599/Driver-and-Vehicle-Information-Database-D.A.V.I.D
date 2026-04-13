import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

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
    const { createdBy: _ignored, ...safeBody } = body
    const ticket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: safeBody,
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
