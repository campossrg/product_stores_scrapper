import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { isAllowedAdminEmail, isLocalAuthBypassEnabled } from '@/lib/admin-access';

const providers =
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : [];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      if (isLocalAuthBypassEnabled()) {
        return true;
      }

      return isAllowedAdminEmail(user.email);
    },
    async session({ session }) {
      if (session.user?.email) {
        session.user.email = session.user.email.toLowerCase();
      }

      return session;
    },
  },
});
