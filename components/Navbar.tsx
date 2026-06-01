import Link from 'next/link';
import { Sprout, BarChart3, List, Shield } from 'lucide-react';
import { auth, signOut } from '@/auth';
import { isAllowedAdminEmail } from '@/lib/admin-access';

export async function Navbar() {
  const session = await auth();
  const isAdmin = isAllowedAdminEmail(session?.user?.email);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Sprout className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                VegTracker
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-600"
            >
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-600"
            >
              <List className="h-4 w-4" />
              Products
            </Link>
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-600"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
                <form
                  action={async () => {
                    'use server';
                    await signOut({ redirectTo: '/' });
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login?callbackUrl=/admin"
                className="rounded-md bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
              >
                Admin sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
