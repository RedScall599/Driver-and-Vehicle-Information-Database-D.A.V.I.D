import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const accident = await prisma.accident.findUnique({
      where: { id: Number(id) },
    })
    if (!accident) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(accident)
  } catch (err) {
    console.error('[GET /api/accidents/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const accident = await prisma.accident.update({
      where: { id: Number(id) },
      data: body,
    })
    return NextResponse.json(accident)
  } catch (err) {
    console.error('[PUT /api/accidents/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    await prisma.accident.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/accidents/:id]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
