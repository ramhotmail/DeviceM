import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Protect these routes
  const isProtected = pathname === '/' || pathname.startsWith('/add') || pathname.startsWith('/edit') || pathname.startsWith('/users') || pathname.startsWith('/report') || pathname.startsWith('/maintenance');

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access login, redirect to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/add', '/edit/:path*', '/users', '/report', '/maintenance', '/login'],
};
