import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const sr = await prisma.serviceRequest.findUnique({
      where: { id: Number(id) },
    })
    if (!sr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && sr.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json(sr)
  } catch (err) {
    console.error('[GET /api/service-requests/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await request.json()
    const existing = await prisma.serviceRequest.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && existing.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const { createdBy: _ignored, id: _id, createdAt: _ca, updatedAt: _ua, documents: _docs, dateOfReport, ...safeBody } = body
    const sr = await prisma.serviceRequest.update({
      where: { id: Number(id) },
      data: {
        ...safeBody,
        ...(dateOfReport !== undefined ? { dateOfReport: dateOfReport && dateOfReport !== '' ? new Date(dateOfReport) : new Date() } : {}),
      },
    })
    return NextResponse.json(sr)
  } catch (err) {
    console.error('[PUT /api/service-requests/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    const { id } = await params
    const existing = await prisma.serviceRequest.findUnique({ where: { id: Number(id) } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (session?.role !== 'admin' && existing.createdBy !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    await prisma.serviceRequest.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/service-requests/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
