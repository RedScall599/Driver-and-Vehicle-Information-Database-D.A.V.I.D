import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const ownerFilter = session?.role === 'admin' ? {} : { createdBy: session?.userId ?? null }
    const vehicles = await prisma.vehicle.findMany({
      where: {
        ...ownerFilter,
        ...(search ? {
          OR: [
            { programVehicle: { contains: search, mode: 'insensitive' } },
            { vinNumber: { contains: search, mode: 'insensitive' } },
            { licensePlateNumber: { contains: search, mode: 'insensitive' } },
            { make: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
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
    const session = await getSession()
    const body = await request.json()
    const { createdBy: _ignored, ...safeBody } = body
    const vehicle = await prisma.vehicle.create({ data: { ...safeBody, createdBy: session?.userId ?? null } })
    return NextResponse.json(vehicle, { status: 201 })
  } catch (err) {
    console.error('[POST /api/vehicles]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
