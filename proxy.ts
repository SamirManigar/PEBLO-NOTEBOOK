import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// We use `jose` because jsonwebtoken is a Node library and Edge Runtime doesn't support it fully
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev');

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that do not require auth:
  // - public files
  // - /login
  // - /signup
  // - /api/auth/*
  // - /shared/*
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/shared') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname === '/'
  ) {
    // If user is accessing /login or /signup while already logged in, redirect to dashboard
    if (pathname === '/login' || pathname === '/signup' || pathname === '/') {
      const token = request.cookies.get('token')?.value;
      if (token) {
        try {
          await jwtVerify(token, JWT_SECRET);
          return NextResponse.redirect(new URL('/notes', request.url));
        } catch (e) {
          // Token invalid, allow them to proceed to login
        }
      }
    }
    return NextResponse.next();
  }

  // Protect /notes, /insights, /api/notes
  const token = request.cookies.get('token')?.value;

  if (!token) {
    // Redirect to login if accessing protected page
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    // Token is invalid/expired
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url));
    
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
