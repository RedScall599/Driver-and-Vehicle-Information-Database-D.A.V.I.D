import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(id) },
      include: { driver: true },
    })
    if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(vehicle)
  } catch (err) {
    console.error('[GET /api/vehicles/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const vehicle = await prisma.vehicle.update({
      where: { id: Number(id) },
      data: body,
    })
    return NextResponse.json(vehicle)
  } catch (err) {
    console.error('[PUT /api/vehicles/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    await prisma.vehicle.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/vehicles/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
