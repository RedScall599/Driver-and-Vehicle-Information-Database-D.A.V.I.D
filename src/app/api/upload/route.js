import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'
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

    // Sanitize original filename to avoid path traversal
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const ext = originalName.includes('.') ? '.' + originalName.split('.').pop() : ''
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

    const blob = await put(`uploads/${uniqueName}`, file.stream(), {
      access: 'public',
      contentType: file.type,
    })

    const data = {
      fileName: uniqueName,
      originalName,
      fileUrl: blob.url,
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
    return NextResponse.json(document, { status: 201 })
  } catch (err) {
    console.error('[POST /api/upload]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
