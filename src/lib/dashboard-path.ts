import type { User } from "next-auth";

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

/** Usuário retornado pelo provider Credentials (campos extras no JWT). */
export type Face2goCredentialsUser = User & {
    role: SessionRole;
    companyId?: string;
    clientId?: string;
    companyUserId?: string;
    clientUserId?: string;
    responsibleId?: string;
};
