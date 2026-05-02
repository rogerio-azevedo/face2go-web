import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { authConfig } from '@/auth.config';
import type { Face2goCredentialsUser } from '@/lib/dashboard-path';

export const { handlers, auth, signIn, signOut } = NextAuth({
    pages: authConfig.pages,
    session: { strategy: 'jwt' },
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }) {
            if (user) {
                const u = user as Face2goCredentialsUser & {
                    accessToken?: string;
                };
                token.role = u.role;
                token.companyId = u.companyId ?? null;
                token.clientId = u.clientId ?? null;
                token.companyUserId = u.companyUserId ?? null;
                token.clientUserId = u.clientUserId ?? null;
                token.accessToken = u.accessToken;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (session.user) {
                session.user.role = token.role as Face2goCredentialsUser['role'];
                session.user.companyId =
                    (token.companyId as string | null) ?? undefined;
                session.user.clientId =
                    (token.clientId as string | null) ?? undefined;
                session.user.companyUserId =
                    (token.companyUserId as string | null) ?? undefined;
                session.user.clientUserId =
                    (token.clientUserId as string | null) ?? undefined;
            }
            session.accessToken = token.accessToken as string | undefined;
            return session;
        },
    },
    providers: [
        Credentials({
            async authorize(credentials): Promise<
                | (Face2goCredentialsUser & { accessToken?: string })
                | null
            > {
                const parsed = z
                    .object({
                        email: z.string().email(),
                        password: z.string().min(6),
                    })
                    .safeParse(credentials);

                if (!parsed.success) return null;

                const base = process.env.NEXT_PUBLIC_API_URL?.replace(
                    /\/$/,
                    '',
                );
                if (!base) {
                    console.error('NEXT_PUBLIC_API_URL não definido');
                    return null;
                }

                const res = await fetch(`${base}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(parsed.data),
                });

                if (!res.ok) return null;

                const data = (await res.json()) as {
                    accessToken: string;
                    user: {
                        id: string;
                        email: string;
                        name?: string | null;
                        role: string;
                        companyId?: string;
                        clientId?: string;
                        companyUserId?: string;
                        clientUserId?: string;
                    };
                };

                const u = data.user;

                return {
                    id: u.id,
                    email: u.email,
                    name: u.name ?? undefined,
                    role: u.role as Face2goCredentialsUser['role'],
                    companyId: u.companyId,
                    clientId: u.clientId,
                    companyUserId: u.companyUserId,
                    clientUserId: u.clientUserId,
                    accessToken: data.accessToken,
                };
            },
        }),
    ],
});
