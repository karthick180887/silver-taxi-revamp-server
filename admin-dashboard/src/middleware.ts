import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Get the token from cookies
    const token = request.cookies.get('token')?.value || request.cookies.get('admin_token')?.value;

    // Paths that don't require authentication
    // Updated: /login instead of /auth/login
    const publicPaths = ['/login', '/_next', '/favicon.ico', '/public'];

    // Check if current path is public
    const isPublicPath = publicPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    );

    // If no token and trying to access protected route
    if (!token && !isPublicPath) {
        const loginUrl = new URL('/login', request.url);
        // loginUrl.searchParams.set('from', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If token exists and trying to access login page, redirect to dashboard
    if (token && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
}

// Configure which paths the middleware runs on
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
