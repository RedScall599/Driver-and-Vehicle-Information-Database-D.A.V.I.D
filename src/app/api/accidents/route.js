import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const accidents = await prisma.accident.findMany({
      where: search
        ? {
            OR: [
              { driverLicenseNumber: { contains: search, mode: 'insensitive' } },
              { driverLastName: { contains: search, mode: 'insensitive' } },
              { vinNumber: { contains: search, mode: 'insensitive' } },
              { claimNumber: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { accidentDate: 'desc' },
    })
    return NextResponse.json(accidents)
  } catch (err) {
    console.error('[GET /api/accidents]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const accident = await prisma.accident.create({ data: body })
    return NextResponse.json(accident, { status: 201 })
  } catch (err) {
    console.error('[POST /api/accidents]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
