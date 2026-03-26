import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const vehicles = await prisma.vehicle.findMany({
      where: search
        ? {
            OR: [
              { programVehicle: { contains: search, mode: 'insensitive' } },
              { vinNumber: { contains: search, mode: 'insensitive' } },
              { licensePlateNumber: { contains: search, mode: 'insensitive' } },
              { make: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { driver: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(vehicles)
  } catch (err) {
    console.error('[GET /api/vehicles]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const vehicle = await prisma.vehicle.create({ data: body })
    return NextResponse.json(vehicle, { status: 201 })
  } catch (err) {
    console.error('[POST /api/vehicles]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
