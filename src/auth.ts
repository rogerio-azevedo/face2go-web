import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

import { authConfig } from '@/auth.config';
import type { Face2goCredentialsUser } from '@/lib/dashboard-path';
import type { UserContext } from '@/types/auth-context';

const sessionCredentialsSchema = z.object({
    mode: z.literal('session'),
    accessToken: z.string().min(1),
    user: z.string().min(1),
    contexts: z.string().optional(),
    activeContext: z.string().optional(),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    pages: authConfig.pages,
    session: { strategy: 'jwt' },
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }) {
            if (user) {
                const u = user as Face2goCredentialsUser & {
                    accessToken?: string;
                    contexts?: UserContext[];
                    activeContext?: UserContext;
                };
                token.role = u.role;
                token.companyId = u.companyId ?? null;
                token.clientId = u.clientId ?? null;
                token.companyUserId = u.companyUserId ?? null;
                token.clientUserId = u.clientUserId ?? null;
                token.responsibleId = u.responsibleId ?? null;
                token.accessToken = u.accessToken;
                token.contexts = u.contexts ?? [];
                token.activeContext = u.activeContext ?? null;
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
                session.user.responsibleId =
                    (token.responsibleId as string | null) ?? undefined;
            }
            session.accessToken = token.accessToken as string | undefined;
            session.contexts = (token.contexts as UserContext[] | undefined) ?? [];
            session.activeContext =
                (token.activeContext as UserContext | null | undefined) ?? null;
            return session;
        },
    },
    providers: [
        Credentials({
            async authorize(credentials): Promise<
                | (Face2goCredentialsUser & {
                      accessToken?: string;
                      contexts?: UserContext[];
                      activeContext?: UserContext;
                  })
                | null
            > {
                const parsed = sessionCredentialsSchema.safeParse(credentials);
                if (!parsed.success) return null;

                let user: Face2goCredentialsUser;
                try {
                    user = JSON.parse(parsed.data.user) as Face2goCredentialsUser;
                } catch {
                    return null;
                }

                let contexts: UserContext[] | undefined;
                if (parsed.data.contexts) {
                    try {
                        contexts = JSON.parse(
                            parsed.data.contexts,
                        ) as UserContext[];
                    } catch {
                        contexts = undefined;
                    }
                }

                let activeContext: UserContext | undefined;
                if (parsed.data.activeContext) {
                    try {
                        activeContext = JSON.parse(
                            parsed.data.activeContext,
                        ) as UserContext;
                    } catch {
                        activeContext = undefined;
                    }
                }

                return {
                    ...user,
                    accessToken: parsed.data.accessToken,
                    contexts,
                    activeContext,
                };
            },
        }),
    ],
});
