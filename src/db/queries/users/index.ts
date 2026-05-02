import { and, asc, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { companyUsers, users } from "@/db/schema";

export type CompanyUserListRow = {
    companyUserId: string;
    userId: string;
    email: string;
    name: string | null;
    role: "company_admin" | "company_operator";
    jobTitle: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: Date;
};

export async function listCompanyUsers(companyId: string): Promise<CompanyUserListRow[]> {
    return db
        .select({
            companyUserId: companyUsers.id,
            userId: users.id,
            email: users.email,
            name: users.name,
            role: companyUsers.role,
            jobTitle: companyUsers.jobTitle,
            phone: companyUsers.phone,
            isActive: companyUsers.isActive,
            createdAt: companyUsers.createdAt,
        })
        .from(companyUsers)
        .innerJoin(users, eq(companyUsers.userId, users.id))
        .where(eq(companyUsers.companyId, companyId))
        .orderBy(asc(users.name));
}

export async function getCompanyUserRow(
    companyUserId: string,
    companyId: string,
) {
    const [row] = await db
        .select()
        .from(companyUsers)
        .where(
            and(
                eq(companyUsers.id, companyUserId),
                eq(companyUsers.companyId, companyId),
            ),
        )
        .limit(1);
    return row;
}

export async function updateCompanyUserRole(
    companyUserId: string,
    companyId: string,
    role: "company_admin" | "company_operator",
) {
    const [row] = await db
        .update(companyUsers)
        .set({ role })
        .where(
            and(
                eq(companyUsers.id, companyUserId),
                eq(companyUsers.companyId, companyId),
            ),
        )
        .returning();
    return row;
}

export async function updateCompanyUserProfile(
    companyUserId: string,
    companyId: string,
    input: { jobTitle?: string | null; phone?: string | null },
) {
    const setPayload: Partial<typeof companyUsers.$inferInsert> = {};
    if (input.jobTitle !== undefined) setPayload.jobTitle = input.jobTitle;
    if (input.phone !== undefined) setPayload.phone = input.phone;

    if (Object.keys(setPayload).length === 0) {
        return getCompanyUserRow(companyUserId, companyId);
    }

    const [row] = await db
        .update(companyUsers)
        .set(setPayload)
        .where(
            and(
                eq(companyUsers.id, companyUserId),
                eq(companyUsers.companyId, companyId),
            ),
        )
        .returning();
    return row;
}

export async function setCompanyUserActive(
    companyUserId: string,
    companyId: string,
    isActive: boolean,
) {
    const [row] = await db
        .update(companyUsers)
        .set({ isActive })
        .where(
            and(
                eq(companyUsers.id, companyUserId),
                eq(companyUsers.companyId, companyId),
            ),
        )
        .returning();
    return row;
}

export async function countActiveAdmins(
    companyId: string,
    excludeCompanyUserId?: string,
) {
    const base = [
        eq(companyUsers.companyId, companyId),
        eq(companyUsers.role, "company_admin"),
        eq(companyUsers.isActive, true),
    ];
    if (excludeCompanyUserId) {
        base.push(ne(companyUsers.id, excludeCompanyUserId));
    }

    const rows = await db
        .select({ id: companyUsers.id })
        .from(companyUsers)
        .where(and(...base));

    return rows.length;
}
