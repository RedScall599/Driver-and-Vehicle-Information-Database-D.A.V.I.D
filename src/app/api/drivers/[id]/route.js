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
    const driver = await prisma.driver.findUnique({
      where: { id: Number(id) },
      include: { vehicles: true, documents: true },
    })
    if (!driver) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && driver.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(driver)
  } catch (err) {
    console.error('[GET /api/drivers/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.driver.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && existing.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (!body.firstName?.trim() || !body.lastName?.trim() || !body.licenseNumber?.trim()) {
      return NextResponse.json(
        { error: 'First name, last name, and license number are required' },
        { status: 422 }
      )
    }
    const { createdBy: _ignored, licenseExpiration, suspensionStartDate, suspensionEndDate, ...safeBody } = body
    const driver = await prisma.driver.update({
      where: { id: Number(id) },
      data: {
        ...safeBody,
        licenseExpiration: toDate(licenseExpiration),
        suspensionStartDate: toDate(suspensionStartDate),
        suspensionEndDate: toDate(suspensionEndDate),
      },
    })
    return NextResponse.json(driver)
  } catch (err) {
    console.error('[PUT /api/drivers/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const existing = await prisma.driver.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && existing.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.driver.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/drivers/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
