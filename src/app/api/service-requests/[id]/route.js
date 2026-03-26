import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const sr = await prisma.serviceRequest.findUnique({
      where: { id: Number(id) },
    })
    if (!sr) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(sr)
  } catch (err) {
    console.error('[GET /api/service-requests/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const sr = await prisma.serviceRequest.update({
      where: { id: Number(id) },
      data: body,
    })
    return NextResponse.json(sr)
  } catch (err) {
    console.error('[PUT /api/service-requests/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    await prisma.serviceRequest.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/service-requests/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
