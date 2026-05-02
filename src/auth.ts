import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { db } from "@/db";
import {
    users,
    accounts,
    sessions,
    verificationTokens,
    companyUsers,
    clientUsers,
} from "@/db/schema";
import type { FaciemCredentialsUser } from "@/lib/dashboard-path";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    session: { strategy: "jwt" },
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials): Promise<FaciemCredentialsUser | null> {
                const parsed = z
                    .object({
                        email: z.string().email(),
                        password: z.string().min(6),
                    })
                    .safeParse(credentials);

                if (!parsed.success) return null;

                const { email, password } = parsed.data;

                const userRow = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1)
                    .then((rows) => rows[0]);

                if (!userRow?.password) return null;
                if (!userRow.isActive) return null;

                const match = await bcrypt.compare(password, userRow.password);
                if (!match) return null;

                if (userRow.role === "super_admin") {
                    return {
                        id: userRow.id,
                        email: userRow.email,
                        name: userRow.name ?? undefined,
                        role: "super_admin",
                    };
                }

                const [companyLink] = await db
                    .select()
                    .from(companyUsers)
                    .where(
                        and(
                            eq(companyUsers.userId, userRow.id),
                            eq(companyUsers.isActive, true)
                        )
                    )
                    .limit(1);

                if (companyLink) {
                    return {
                        id: userRow.id,
                        email: userRow.email,
                        name: userRow.name ?? undefined,
                        role: companyLink.role,
                        companyId: companyLink.companyId,
                        companyUserId: companyLink.id,
                    };
                }

                const [clientLink] = await db
                    .select()
                    .from(clientUsers)
                    .where(
                        and(
                            eq(clientUsers.userId, userRow.id),
                            eq(clientUsers.isActive, true)
                        )
                    )
                    .limit(1);

                if (clientLink) {
                    return {
                        id: userRow.id,
                        email: userRow.email,
                        name: userRow.name ?? undefined,
                        role: clientLink.role,
                        clientId: clientLink.clientId,
                        clientUserId: clientLink.id,
                    };
                }

                if (userRow.role === "face_user") {
                    return {
                        id: userRow.id,
                        email: userRow.email,
                        name: userRow.name ?? undefined,
                        role: "face_user",
                    };
                }

                return null;
            },
        }),
    ],
    callbacks: {
        ...authConfig.callbacks,
        async jwt({ token, user }) {
            if (user) {
                const u = user as FaciemCredentialsUser;
                token.role = u.role;
                token.companyId = u.companyId ?? null;
                token.clientId = u.clientId ?? null;
                token.companyUserId = u.companyUserId ?? null;
                token.clientUserId = u.clientUserId ?? null;
            }
            return token;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (session.user) {
                session.user.role = token.role as FaciemCredentialsUser["role"];
                session.user.companyId =
                    (token.companyId as string | null) ?? undefined;
                session.user.clientId =
                    (token.clientId as string | null) ?? undefined;
                session.user.companyUserId =
                    (token.companyUserId as string | null) ?? undefined;
                session.user.clientUserId =
                    (token.clientUserId as string | null) ?? undefined;
            }
            return session;
        },
    },
});
