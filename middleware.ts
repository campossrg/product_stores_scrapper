import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAllowedAdminEmail, isLocalAuthBypassEnabled } from '@/lib/admin-access';

const authMiddleware = auth((request) => {
  const isAdmin = isAllowedAdminEmail(request.auth?.user?.email);

  if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export default function middleware(request: Request, context: any) {
  if (isLocalAuthBypassEnabled()) {
    return NextResponse.next();
  }

  return authMiddleware(request as any, context);
}

export const config = {
  matcher: ['/admin/:path*'],
};
