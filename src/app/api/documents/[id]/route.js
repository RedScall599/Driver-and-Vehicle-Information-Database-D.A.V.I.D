import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const doc = await prisma.document.findUnique({ where: { id }, omit: { fileData: true } })
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // File data is stored in the DB row — deleting the record removes it
    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/documents/[id]]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
