import { NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const doc = await prisma.document.findUnique({ where: { id } })
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Delete file from disk — ignore errors if file is already gone
    try {
      const filePath = path.join(process.cwd(), 'public', doc.fileUrl)
      await unlink(filePath)
    } catch {}

    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/documents/[id]]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
