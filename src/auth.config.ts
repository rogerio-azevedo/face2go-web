import type { NextAuthConfig } from "next-auth";

import { evaluateCompanyFeatureAction } from "@/lib/company-feature-access";
import { getDashboardPathForRole } from "@/lib/dashboard-path";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async authorized({ auth, request: { nextUrl } }) {
            const path = nextUrl.pathname;
            const user = auth?.user;
            const isLoggedIn = !!user;
            const role = user?.role;

            if (path.startsWith("/api/auth")) {
                return true;
            }

            if (path === "/login") {
                if (isLoggedIn) {
                    return Response.redirect(
                        new URL(getDashboardPathForRole(role), nextUrl)
                    );
                }
                return true;
            }

            if (path === "/register" || path.startsWith("/register/")) {
                if (isLoggedIn) {
                    return Response.redirect(
                        new URL(getDashboardPathForRole(role), nextUrl)
                    );
                }
                return true;
            }

            if (path.startsWith("/super-admin")) {
                if (!isLoggedIn) return false;
                if (role !== "super_admin") {
                    return Response.redirect(
                        new URL("/login?error=Sem permissão", nextUrl)
                    );
                }
                return true;
            }

            if (path.startsWith("/company")) {
                if (!isLoggedIn) return false;
                if (role !== "company_admin" && role !== "company_operator") {
                    return Response.redirect(
                        new URL("/login?error=Sem permissão", nextUrl)
                    );
                }
                if (
                    path.startsWith("/company/usuarios") &&
                    role !== "company_admin"
                ) {
                    return Response.redirect(
                        new URL("/company/dashboard", nextUrl)
                    );
                }
                if (
                    path.startsWith("/company/clientes") &&
                    role === 'company_operator'
                ) {
                    const allowed = await evaluateCompanyFeatureAction(
                        auth?.accessToken,
                        'clients',
                        'can_read',
                    );
                    if (!allowed) {
                        return Response.redirect(
                            new URL('/company/dashboard', nextUrl),
                        );
                    }
                }
                return true;
            }

            if (path.startsWith("/client")) {
                if (!isLoggedIn) return false;
                const allowed =
                    role === "client_admin" ||
                    role === "client_operator" ||
                    role === "face_user";
                if (!allowed) {
                    return Response.redirect(
                        new URL("/login?error=Sem permissão", nextUrl)
                    );
                }
                return true;
            }

            return true;
        },
    },
    providers: [],
} satisfies NextAuthConfig;
