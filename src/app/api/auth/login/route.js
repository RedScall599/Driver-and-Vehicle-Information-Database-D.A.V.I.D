import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createSession, sessionCookieOptions } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } })

    // Use a constant-time check even when user not found to prevent timing attacks
    const hash = user?.passwordHash ?? '$2b$12$invalidhashfortimingnobodyKnows'
    const valid = await bcrypt.compare(password, hash)

    if (!user || !valid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const token = await createSession(user)
    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
    res.cookies.set(sessionCookieOptions(token))
    return res
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
