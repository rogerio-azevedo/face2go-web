import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { companyUserPermissions } from "@/db/schema";

import type { FeatureSlug, PermissionAction } from "./features";

/** Avalia permissão granular sem depender do `auth()` (uso em middleware / auth.config). */
export async function evaluateCompanyFeatureAction(
    role: string,
    companyUserId: string | undefined | null,
    featureSlug: FeatureSlug,
    action: PermissionAction,
): Promise<boolean> {
    if (!companyUserId) return false;

    const permission = await db.query.companyUserPermissions.findFirst({
        where: and(
            eq(companyUserPermissions.companyUserId, companyUserId),
            eq(companyUserPermissions.featureSlug, featureSlug),
        ),
    });

    if (role === "company_admin") {
        if (!permission) return true;
        return permission.actions.includes(action);
    }

    if (role === "company_operator") {
        return permission?.actions.includes(action) ?? false;
    }

    return false;
}
