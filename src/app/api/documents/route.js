import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const recordType = searchParams.get('type')
    const recordId = parseInt(searchParams.get('recordId'))

    if (!recordType || isNaN(recordId)) {
      return NextResponse.json({ error: 'Missing type or recordId' }, { status: 400 })
    }

    const where = {}
    if (recordType === 'driver') where.driverId = recordId
    else if (recordType === 'vehicle') where.vehicleId = recordId
    else if (recordType === 'accident') where.accidentId = recordId
    else if (recordType === 'ticket') where.ticketId = recordId
    else if (recordType === 'serviceRequest') where.serviceRequestId = recordId
    else return NextResponse.json({ error: 'Unknown record type' }, { status: 400 })

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(documents)
  } catch (err) {
    console.error('[GET /api/documents]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
