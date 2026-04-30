import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

const MAX_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const recordType = formData.get('recordType')
    const recordId = parseInt(formData.get('recordId'))

    if (!file || !recordType || !recordId || isNaN(recordId)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Sanitize original filename
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const ext = originalName.includes('.') ? '.' + originalName.split('.').pop() : ''
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

    const data = {
      fileName: uniqueName,
      originalName,
      fileUrl: '',       // filled in after we have the id
      fileData: buffer,
      fileType: file.type,
      fileSize: file.size,
    }

    if (recordType === 'driver') data.driverId = recordId
    else if (recordType === 'vehicle') data.vehicleId = recordId
    else if (recordType === 'accident') data.accidentId = recordId
    else if (recordType === 'ticket') data.ticketId = recordId
    else if (recordType === 'serviceRequest') data.serviceRequestId = recordId
    else return NextResponse.json({ error: 'Unknown record type' }, { status: 400 })

    const document = await prisma.document.create({ data })

    // Now that we have the id, set the serve URL
    const updated = await prisma.document.update({
      where: { id: document.id },
      data: { fileUrl: `/api/documents/${document.id}/file` },
      omit: { fileData: true },
    })

    return NextResponse.json(updated, { status: 201 })
  } catch (err) {
    console.error('[POST /api/upload]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
