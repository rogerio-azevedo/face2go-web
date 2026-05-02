import { and, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { companyUserPermissions } from "@/db/schema";

import {
    ALL_FEATURES,
    type FeatureSlug,
    type PermissionAction,
} from "./features";
import { ROUTE_PERMISSIONS } from "./route-permissions";

const ALL_PERMISSION_ACTIONS: PermissionAction[] = [
    "can_read",
    "can_create",
    "can_update",
    "can_delete",
];

/**
 * Verifica se o usuário logado tem uma ação em uma feature.
 * Super admin: irrestrito. Admin da empresa: sem registro no banco = acesso total (legado).
 */
export async function can(
    featureSlug: FeatureSlug,
    action: PermissionAction,
): Promise<boolean> {
    const session = await auth();

    if (!session?.user?.companyId) return false;

    if (session.user.role === "super_admin") return true;

    const companyUserId = session.user.companyUserId;
    if (!companyUserId) return false;

    const permission = await db.query.companyUserPermissions.findFirst({
        where: and(
            eq(companyUserPermissions.companyUserId, companyUserId),
            eq(companyUserPermissions.featureSlug, featureSlug),
        ),
    });

    if (session.user.role === "company_admin") {
        if (!permission) return true;
        return permission.actions.includes(action);
    }

    return permission?.actions.includes(action) ?? false;
}

export async function getPermissions(
    featureSlug: FeatureSlug,
): Promise<PermissionAction[]> {
    const session = await auth();

    if (!session?.user?.companyId) return [];

    if (session.user.role === "super_admin") {
        return [...ALL_PERMISSION_ACTIONS];
    }

    const companyUserId = session.user.companyUserId;
    if (!companyUserId) return [];

    const permission = await db.query.companyUserPermissions.findFirst({
        where: and(
            eq(companyUserPermissions.companyUserId, companyUserId),
            eq(companyUserPermissions.featureSlug, featureSlug),
        ),
    });

    if (session.user.role === "company_admin") {
        if (!permission) return [...ALL_PERMISSION_ACTIONS];
        return (permission.actions ?? []) as PermissionAction[];
    }

    return (permission?.actions ?? []) as PermissionAction[];
}

function readableFeatureSlugsFromPermissionRows(
    rows: { featureSlug: string; actions: string[] }[],
    companyRole: "company_admin" | "company_operator" | null | undefined,
): Set<FeatureSlug> {
    const bySlug = new Map<string, string[]>();
    for (const r of rows) {
        bySlug.set(r.featureSlug, r.actions);
    }

    const readable = new Set<FeatureSlug>();
    for (const f of ALL_FEATURES) {
        const slug = f.slug;
        const actions = bySlug.get(slug);
        if (companyRole === "company_admin") {
            if (!actions) {
                readable.add(slug);
            } else if (actions.includes("can_read")) {
                readable.add(slug);
            }
        } else if (actions?.includes("can_read")) {
            readable.add(slug);
        }
    }
    return readable;
}

export async function getSidebarNavAccess(): Promise<{
    mainPaths: string[] | null;
}> {
    const session = await auth();
    const user = session?.user;

    if (!user) {
        return { mainPaths: null };
    }

    if (user.role === "super_admin") {
        return { mainPaths: null };
    }

    if (!user.companyId || !user.companyUserId) {
        return { mainPaths: ["/company/dashboard"] };
    }

    if (user.role === "company_admin") {
        const rows = await db.query.companyUserPermissions.findMany({
            where: eq(companyUserPermissions.companyUserId, user.companyUserId),
        });

        const readableSlugs = readableFeatureSlugsFromPermissionRows(
            rows,
            "company_admin",
        );

        const mainPaths = new Set<string>(["/company/dashboard"]);
        for (const [path, slug] of Object.entries(ROUTE_PERMISSIONS)) {
            if (slug && readableSlugs.has(slug)) {
                mainPaths.add(path);
            }
        }
        return { mainPaths: [...mainPaths] };
    }

    if (user.role === "company_operator") {
        const rows = await db.query.companyUserPermissions.findMany({
            where: eq(companyUserPermissions.companyUserId, user.companyUserId),
        });

        const readableSlugs = readableFeatureSlugsFromPermissionRows(
            rows,
            "company_operator",
        );

        const mainPaths = new Set<string>(["/company/dashboard"]);
        for (const [path, slug] of Object.entries(ROUTE_PERMISSIONS)) {
            if (slug && readableSlugs.has(slug)) {
                mainPaths.add(path);
            }
        }
        return { mainPaths: [...mainPaths] };
    }

    return { mainPaths: null };
}
