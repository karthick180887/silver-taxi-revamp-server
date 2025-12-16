import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('adminToken')?.value;
    const isLoginPage = request.nextUrl.pathname.startsWith('/login');

    // List of public paths that don't need auth (e.g. static files, favicon)
    // We use a negative lookahead regex in config typically, but explicit checking here is also saf.
    // Actually, config matcher checks first.

    if (!token && !isLoginPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
