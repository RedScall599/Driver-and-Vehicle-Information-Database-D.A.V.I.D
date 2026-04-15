import { NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/auth/signup', '/api/helpdesk/escalate', '/api/helpdesk/acknowledge']
const COOKIE = 'david_session'
const SECRET_KEY = () => new TextEncoder().encode(process.env.JWT_SECRET)

async function verify(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY())
    return payload
  } catch {
    return null
  }
}

async function refreshToken(payload) {
  const { iat, exp, ...claims } = payload
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(SECRET_KEY())
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow public paths, static assets, and Next.js internals
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get(COOKIE)?.value

  if (!token) {
    // API routes get a 401 JSON response; pages get redirected to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const session = await verify(token)
  if (!session) {
    if (pathname.startsWith('/api/')) {
      const res = NextResponse.json({ error: 'Session expired. Please log in again.' }, { status: 401 })
      res.cookies.delete(COOKIE)
      return res
    }
    const loginUrl = new URL('/login', request.url)
    const res = NextResponse.redirect(loginUrl)
    res.cookies.delete(COOKIE)
    return res
  }

  // Slide the session — issue a fresh 30-minute token on every request
  const newToken = await refreshToken(session)
  const res = NextResponse.next()
  res.cookies.set({
    name: COOKIE,
    value: newToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 30,
  })
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
