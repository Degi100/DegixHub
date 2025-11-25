import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For API proxy requests, forward cookies
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();

    // Forward cookies from the request to the proxied API
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      response.headers.set('cookie', cookieHeader);
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};