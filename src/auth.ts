import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Kakao from 'next-auth/providers/kakao';
import pool from '@/lib/db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ account }) {
      if (!account) return false;
      await pool.query(
        `INSERT INTO users (provider, provider_id) VALUES ($1, $2)
         ON CONFLICT (provider, provider_id) DO NOTHING`,
        [account.provider, account.providerAccountId]
      );
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        const { rows } = await pool.query(
          'SELECT id FROM users WHERE provider = $1 AND provider_id = $2',
          [account.provider, account.providerAccountId]
        );
        if (rows[0]) token.userId = rows[0].id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      return session;
    },
  },
});
