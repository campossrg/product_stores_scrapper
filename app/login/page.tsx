import { signIn } from '@/auth';

interface LoginPageProps {
  searchParams?: {
    callbackUrl?: string;
    error?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const callbackUrl = searchParams?.callbackUrl || '/admin';
  const isAccessDenied = searchParams?.error === 'AccessDenied';

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-12">
      <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Admin access</h1>
        <p className="mt-3 text-sm text-gray-600">
          Sign in with Google using an email address that is included in the admin allowlist.
        </p>

        {isAccessDenied ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            This Google account is not allowed to access the admin area.
          </div>
        ) : null}

        <form
          className="mt-6"
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: callbackUrl });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
