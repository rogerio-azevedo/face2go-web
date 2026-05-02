import { eq } from "drizzle-orm";

import { db } from "@/db";
import { inviteLinks } from "@/db/schema";
import { getCompanyById } from "@/db/queries/companies";
import type { GenerateInviteInput } from "@/lib/validations/invites";

export async function generateInviteCode(
    data: GenerateInviteInput,
): Promise<{ success: true; code: string } | { success: false; error: string }> {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();

    try {
        await db.insert(inviteLinks).values({
            companyId: data.companyId,
            role: data.role,
            code,
        });
        return { success: true, code };
    } catch {
        return { success: false, error: "Falha ao gerar convite" };
    }
}

export async function getInviteByCode(code: string) {
    const invite = await db.query.inviteLinks.findFirst({
        where: eq(inviteLinks.code, code),
    });
    if (!invite) return null;
    const company = await getCompanyById(invite.companyId);
    return { invite, company: company ?? null };
}

export async function incrementInviteUsedCount(inviteId: string) {
    const row = await db.query.inviteLinks.findFirst({
        where: eq(inviteLinks.id, inviteId),
    });
    if (!row) return;
    await db
        .update(inviteLinks)
        .set({ usedCount: (row.usedCount ?? 0) + 1 })
        .where(eq(inviteLinks.id, inviteId));
}

export async function deactivateInvite(inviteId: string) {
    await db
        .update(inviteLinks)
        .set({ isActive: false })
        .where(eq(inviteLinks.id, inviteId));
}
