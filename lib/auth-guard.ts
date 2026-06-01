import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { isAllowedAdminEmail } from '@/lib/admin-access';

export async function requireAdminApi() {
  const session = await auth();

  if (!isAllowedAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
