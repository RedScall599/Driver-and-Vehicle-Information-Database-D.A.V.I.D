import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const ticket = await prisma.ticket.findUnique({
      where: { id: Number(id) },
    })
    if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(ticket)
  } catch (err) {
    console.error('[GET /api/tickets/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const ticket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: body,
    })
    return NextResponse.json(ticket)
  } catch (err) {
    console.error('[PUT /api/tickets/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    await prisma.ticket.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/tickets/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
