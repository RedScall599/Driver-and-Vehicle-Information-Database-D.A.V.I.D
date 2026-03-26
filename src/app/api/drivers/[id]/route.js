import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const driver = await prisma.driver.findUnique({
      where: { id: Number(id) },
      include: { vehicles: true, documents: true },
    })
    if (!driver) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(driver)
  } catch (err) {
    console.error('[GET /api/drivers/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    if (!body.firstName?.trim() || !body.lastName?.trim() || !body.licenseNumber?.trim()) {
      return NextResponse.json(
        { error: 'First name, last name, and license number are required' },
        { status: 422 }
      )
    }
    const driver = await prisma.driver.update({
      where: { id: Number(id) },
      data: body,
    })
    return NextResponse.json(driver)
  } catch (err) {
    console.error('[PUT /api/drivers/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    await prisma.driver.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/drivers/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
