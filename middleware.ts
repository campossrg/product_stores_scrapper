import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAllowedAdminEmail } from '@/lib/admin-access';

export default auth((request) => {
  const isAdmin = isAllowedAdminEmail(request.auth?.user?.email);

  if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
