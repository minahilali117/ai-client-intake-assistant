import { DefaultSession } from 'next-auth';

export type AppRole = 'ADMIN' | 'SALES' | 'DEVELOPER';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: AppRole;
    } & DefaultSession['user'];
    accessToken: string;
  }

  interface User {
    id: string;
    role: AppRole;
    accessToken: string;
    refreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: AppRole;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}
