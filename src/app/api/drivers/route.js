import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET(request) {
  try {
    const session = await getSession()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const ownerFilter = session?.role === 'admin' ? {} : { createdBy: session?.userId ?? null }
    const drivers = await prisma.driver.findMany({
      where: {
        ...ownerFilter,
        ...(search ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { licenseNumber: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
      },
      orderBy: { lastName: 'asc' },
    })
    return NextResponse.json(drivers)
  } catch (err) {
    console.error('[GET /api/drivers]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    const body = await request.json()
    if (!body.firstName?.trim() || !body.lastName?.trim() || !body.licenseNumber?.trim()) {
      return NextResponse.json(
        { error: 'First name, last name, and license number are required' },
        { status: 422 }
      )
    }
    const { createdBy: _ignored, ...safeBody } = body
    const driver = await prisma.driver.create({ data: { ...safeBody, createdBy: session?.userId ?? null } })
    return NextResponse.json(driver, { status: 201 })
  } catch (err) {
    console.error('[POST /api/drivers]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
