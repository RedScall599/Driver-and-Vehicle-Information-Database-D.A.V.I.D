import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(id) },
      include: { driver: true },
    })
    if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && vehicle.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(vehicle)
  } catch (err) {
    console.error('[GET /api/vehicles/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.vehicle.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && existing.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { createdBy: _ignored, id: _id, createdAt: _ca, updatedAt: _ua, driver: _driver, accidents: _acc, tickets: _tix, documents: _docs, ...safeBody } = body
    const vehicle = await prisma.vehicle.update({
      where: { id: Number(id) },
      data: safeBody,
    })
    return NextResponse.json(vehicle)
  } catch (err) {
    console.error('[PUT /api/vehicles/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const existing = await prisma.vehicle.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && existing.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.vehicle.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/vehicles/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
