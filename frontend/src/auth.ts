import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {
  ApiError,
  apiLogin,
  apiRefresh,
  type AuthApiResponse,
} from '@/lib/api';
import type { AppRole } from '@/types/next-auth';

const ACCESS_TOKEN_TTL_MS = 14 * 60 * 1000;
let refreshPromise: Promise<AuthApiResponse> | null = null;

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV !== 'production'
    ? 'local-dev-auth-secret-minimum-32-characters'
    : undefined);

if (!authSecret) {
  throw new Error(
    'Missing AUTH_SECRET or NEXTAUTH_SECRET. Copy frontend/.env.local.example to frontend/.env.local',
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const result = await apiLogin({
            email: String(credentials.email),
            password: String(credentials.password),
          });

          return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          };
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            return null;
          }

          const message =
            error instanceof Error ? error.message : 'Authentication failed';
          throw new Error(message);
        }
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user?.id);
      const isProtected = request.nextUrl.pathname.startsWith('/dashboard');
      if (isProtected) {
        return isLoggedIn;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + ACCESS_TOKEN_TTL_MS;
        return token;
      }

      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      try {
        if (!refreshPromise) {
          console.log('STARTING REFRESH REQUEST');

          refreshPromise = apiRefresh(
            token.refreshToken as string,
          ).finally(() => {
            console.log('REFRESH COMPLETE');
            refreshPromise = null;
          });
        } else {
          console.log('WAITING FOR EXISTING REFRESH');
        }

        const refreshed = await refreshPromise;

        token.accessToken = refreshed.accessToken;
        token.refreshToken = refreshed.refreshToken;
        token.role = refreshed.user.role;
        token.accessTokenExpires =
          Date.now() + ACCESS_TOKEN_TTL_MS;
      } catch {
        return { ...token, error: 'RefreshAccessTokenError' };
      }

      return token;
    },
    async session({ session, token }) {
      if (token.error === 'RefreshAccessTokenError') {
        return { ...session, user: undefined, accessToken: '' };
      }

      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AppRole;
      }
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  trustHost: true,
});
