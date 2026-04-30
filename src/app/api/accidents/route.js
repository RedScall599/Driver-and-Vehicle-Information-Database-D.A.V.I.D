import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const ownerFilter = session?.role === 'admin' ? {} : { createdBy: session?.userId ?? null }
    const accidents = await prisma.accident.findMany({
      where: {
        ...ownerFilter,
        ...(search ? {
          OR: [
            { driverLicenseNumber: { contains: search, mode: 'insensitive' } },
            { driverLastName: { contains: search, mode: 'insensitive' } },
            { vinNumber: { contains: search, mode: 'insensitive' } },
            { claimNumber: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { accidentDate: 'desc' },
    })
    return NextResponse.json(accidents)
  } catch (err) {
    console.error('[GET /api/accidents]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function toDate(val) {
  if (!val || val === '') return null
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

export async function POST(request) {
  try {
    const session = await getSession()
    const body = await request.json()
    const { createdBy: _ignored, accidentDate, policeReportDate, dateReportedToInsurance, ...safeBody } = body
    const accident = await prisma.accident.create({
      data: {
        ...safeBody,
        accidentDate: toDate(accidentDate),
        policeReportDate: toDate(policeReportDate),
        dateReportedToInsurance: toDate(dateReportedToInsurance),
        createdBy: session?.userId ?? null,
      },
    })
    return NextResponse.json(accident, { status: 201 })
  } catch (err) {
    console.error('[POST /api/accidents]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
