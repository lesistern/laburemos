import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  // Admin routes protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const token = request.cookies.get('access_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/auth/login?redirect=/admin', request.url))
    }

    try {
      const payload = await verifyJWT(token)
      
      // Check if user is admin
      if (payload.userType !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url))
      }

      // User is authenticated and is admin, allow access
      return NextResponse.next()
    } catch (error) {
      // Token is invalid, redirect to login
      return NextResponse.redirect(new URL('/auth/login?redirect=/admin', request.url))
    }
  }

  // Dashboard and protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/profile') ||
      request.nextUrl.pathname.startsWith('/projects') ||
      request.nextUrl.pathname.startsWith('/services') ||
      request.nextUrl.pathname.startsWith('/messages') ||
      request.nextUrl.pathname.startsWith('/wallet') ||
      request.nextUrl.pathname.startsWith('/notifications')) {
    
    const token = request.cookies.get('access_token')?.value

    if (!token) {
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(request.nextUrl.pathname)}`
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    try {
      await verifyJWT(token)
      return NextResponse.next()
    } catch (error) {
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(request.nextUrl.pathname)}`
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/projects/:path*',
    '/services/:path*',
    '/messages/:path*',
    '/wallet/:path*',
    '/notifications/:path*'
  ]
}