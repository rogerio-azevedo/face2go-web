import type { User } from "next-auth";

import { evaluateCompanyFeatureAction } from "@/lib/company-feature-access";

/** Papéis efetivos na sessão (global + tenant). */
export type SessionRole =
    | "super_admin"
    | "company_admin"
    | "company_operator"
    | "client_admin"
    | "client_operator"
    | "face_user"
    | "responsible";

export function getDashboardPathForRole(role: string | undefined): string {
    switch (role) {
        case "super_admin":
            return "/super-admin/dashboard";
        case "company_admin":
        case "company_operator":
            return "/company/dashboard";
        case "client_admin":
        case "client_operator":
        case "face_user":
            return "/client/dashboard";
        case "responsible":
            return "/sem-acesso";
        default:
            return "/sem-acesso";
    }
}

/** Redireciona operadores com acesso exclusivo a monitoramento. */
export async function resolveDashboardPathForAuth(auth: {
    accessToken?: string;
    user?: { role?: string };
}): Promise<string> {
    const role = auth.user?.role;
    const base = getDashboardPathForRole(role);

    if (role !== "company_admin" && role !== "company_operator") {
        return base;
    }

    const hasMonitoring = await evaluateCompanyFeatureAction(
        auth.accessToken,
        "monitoring",
        "can_read",
    );
    if (!hasMonitoring) return base;

    const featureChecks = await Promise.all(
        (
            [
                "clients",
                "visitors",
                "reports",
                "devices",
                "access_control",
                "users",
            ] as const
        ).map((feature) =>
            evaluateCompanyFeatureAction(auth.accessToken, feature, "can_read"),
        ),
    );

    const hasOtherFeatures = featureChecks.some(Boolean);
    return hasOtherFeatures ? base : "/monitoring";
}

/** Usuário retornado pelo provider Credentials (campos extras no JWT). */
export type Face2goCredentialsUser = User & {
    role: SessionRole;
    companyId?: string;
    clientId?: string;
    companyUserId?: string;
    clientUserId?: string;
    responsibleId?: string;
};
