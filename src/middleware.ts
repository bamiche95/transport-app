import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET_KEY!);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Allow access to login and public assets
  if (pathname.startsWith('/') || pathname.startsWith('/_next') || pathname === '/') {
    return NextResponse.next();
  }

  // 2. If no token exists, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    // 3. Verify token (will throw error if expired or invalid)
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    // 4. Token expired or invalid -> Redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token'); // Clear the bad cookie
    return response;
  }
}

// Configure which paths are protected
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};