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
    const accident = await prisma.accident.findUnique({
      where: { id: Number(id) },
    })
    if (!accident) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && accident.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(accident)
  } catch (err) {
    console.error('[GET /api/accidents/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.accident.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && existing.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { createdBy: _ignored, accidentDate, policeReportDate, dateReportedToInsurance, ...safeBody } = body
    const accident = await prisma.accident.update({
      where: { id: Number(id) },
      data: {
        ...safeBody,
        accidentDate: toDate(accidentDate),
        policeReportDate: toDate(policeReportDate),
        dateReportedToInsurance: toDate(dateReportedToInsurance),
      },
    })
    return NextResponse.json(accident)
  } catch (err) {
    console.error('[PUT /api/accidents/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const existing = await prisma.accident.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && existing.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.accident.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/accidents/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
