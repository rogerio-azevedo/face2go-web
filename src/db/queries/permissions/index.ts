import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { companyUserPermissions, features } from "@/db/schema";

export async function listFeaturesCatalog() {
    return db.select().from(features).orderBy(asc(features.name));
}

export async function listPermissionsForCompanyUser(companyUserId: string) {
    return db.query.companyUserPermissions.findMany({
        where: eq(companyUserPermissions.companyUserId, companyUserId),
    });
}

export async function upsertCompanyUserPermission(
    companyUserId: string,
    featureSlug: string,
    actions: string[],
) {
    const now = new Date();
    await db
        .insert(companyUserPermissions)
        .values({
            companyUserId,
            featureSlug,
            actions,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [
                companyUserPermissions.companyUserId,
                companyUserPermissions.featureSlug,
            ],
            set: {
                actions,
                updatedAt: now,
            },
        });
}

export async function deleteCompanyUserPermission(
    companyUserId: string,
    featureSlug: string,
) {
    await db
        .delete(companyUserPermissions)
        .where(
            and(
                eq(companyUserPermissions.companyUserId, companyUserId),
                eq(companyUserPermissions.featureSlug, featureSlug),
            ),
        );
}
