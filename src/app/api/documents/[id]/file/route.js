import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) return new Response('Invalid id', { status: 400 })

    const doc = await prisma.document.findUnique({ where: { id } })
    if (!doc || !doc.fileData) return new Response('Not found', { status: 404 })

    const contentType = doc.fileType || 'application/octet-stream'
    const disposition = contentType.startsWith('image/') ? 'inline' : 'inline'

    return new Response(doc.fileData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${disposition}; filename="${doc.originalName}"`,
        'Content-Length': String(doc.fileSize ?? doc.fileData.length),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[GET /api/documents/:id/file]', err)
    return new Response('Server error', { status: 500 })
  }
}
