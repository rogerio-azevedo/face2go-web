"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
    deleteCompanyUserPermission,
    upsertCompanyUserPermission,
} from "@/db/queries/permissions";
import {
    countActiveAdmins,
    getCompanyUserRow,
    setCompanyUserActive,
    updateCompanyUserProfile,
    updateCompanyUserRole,
} from "@/db/queries/users";
import { ALL_FEATURES, type FeatureSlug, type PermissionAction } from "@/lib/features";

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return "Dados inválidos.";
}

async function requireCompanyAdmin() {
    const session = await auth();
    if (
        !session?.user?.companyId ||
        session.user.role !== "company_admin"
    ) {
        return null;
    }
    return session;
}

const roleSchema = z.enum(["company_admin", "company_operator"]);

const updateRoleSchema = z.object({
    companyUserId: z.string().uuid(),
    role: roleSchema,
});

export async function updateCompanyMemberRoleAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    const session = await requireCompanyAdmin();
    if (!session?.user.companyId) {
        return { error: "Sem permissão." };
    }

    const parsed = updateRoleSchema.safeParse(input);
    if (!parsed.success) {
        return { error: zodFirstMessage(parsed.error) };
    }

    const { companyUserId, role } = parsed.data;
    const companyId = session.user.companyId;

    const row = await getCompanyUserRow(companyUserId, companyId);
    if (!row) {
        return { error: "Usuário não encontrado." };
    }

    if (row.userId === session.user.id) {
        return { error: "Você não pode alterar seu próprio papel por aqui." };
    }

    if (row.role === "company_admin" && role === "company_operator") {
        const others = await countActiveAdmins(companyId, companyUserId);
        if (others < 1) {
            return {
                error: "Mantenha pelo menos outro administrador ativo antes desta alteração.",
            };
        }
    }

    await updateCompanyUserRole(companyUserId, companyId, role);
    revalidatePath("/company/usuarios");
    return { success: true };
}

const toggleActiveSchema = z.object({
    companyUserId: z.string().uuid(),
    isActive: z.boolean(),
});

export async function toggleCompanyMemberActiveAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    const session = await requireCompanyAdmin();
    if (!session?.user.companyId) {
        return { error: "Sem permissão." };
    }

    const parsed = toggleActiveSchema.safeParse(input);
    if (!parsed.success) {
        return { error: zodFirstMessage(parsed.error) };
    }

    const { companyUserId, isActive } = parsed.data;
    const companyId = session.user.companyId;

    const row = await getCompanyUserRow(companyUserId, companyId);
    if (!row) {
        return { error: "Usuário não encontrado." };
    }

    if (row.userId === session.user.id) {
        return { error: "Você não pode desativar a si mesmo." };
    }

    if (!isActive && row.role === "company_admin") {
        const others = await countActiveAdmins(companyId, companyUserId);
        if (others < 1) {
            return {
                error: "Mantenha pelo menos um administrador ativo na empresa.",
            };
        }
    }

    await setCompanyUserActive(companyUserId, companyId, isActive);
    revalidatePath("/company/usuarios");
    return { success: true };
}

const profileSchema = z.object({
    companyUserId: z.string().uuid(),
    name: z.string().trim().min(2).max(255).optional(),
    jobTitle: z.string().trim().min(2).max(120).optional().nullable(),
    phone: z.string().trim().min(8).max(30).optional().nullable(),
});

export async function updateCompanyMemberProfileAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    const session = await requireCompanyAdmin();
    if (!session?.user.companyId) {
        return { error: "Sem permissão." };
    }

    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) {
        return { error: zodFirstMessage(parsed.error) };
    }

    const companyId = session.user.companyId;
    const { companyUserId, name, jobTitle, phone } = parsed.data;

    const row = await getCompanyUserRow(companyUserId, companyId);
    if (!row) {
        return { error: "Usuário não encontrado." };
    }

    if (name !== undefined) {
        await db
            .update(users)
            .set({ name })
            .where(eq(users.id, row.userId));
    }

    const phoneNorm =
        phone === null || phone === undefined
            ? phone
            : phone.replace(/\D/g, "") || phone.trim();

    if (jobTitle !== undefined || phone !== undefined) {
        await updateCompanyUserProfile(companyUserId, companyId, {
            ...(jobTitle !== undefined ? { jobTitle } : {}),
            ...(phone !== undefined ? { phone: phoneNorm } : {}),
        });
    }

    revalidatePath("/company/usuarios");
    return { success: true };
}

const permissionsSchema = z.object({
    companyUserId: z.string().uuid(),
    featureSlug: z.string(),
    actions: z.array(
        z.enum(["can_read", "can_create", "can_update", "can_delete"]),
    ),
});

export async function updateCompanyMemberPermissionsAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    const session = await requireCompanyAdmin();
    if (!session?.user.companyId) {
        return { error: "Sem permissão." };
    }

    const parsed = permissionsSchema.safeParse(input);
    if (!parsed.success) {
        return { error: zodFirstMessage(parsed.error) };
    }

    const { companyUserId, featureSlug, actions } = parsed.data;

    if (!ALL_FEATURES.some((f) => f.slug === featureSlug)) {
        return { error: "Módulo inválido." };
    }

    const slug = featureSlug as FeatureSlug;
    const companyId = session.user.companyId;

    const row = await getCompanyUserRow(companyUserId, companyId);
    if (!row) {
        return { error: "Usuário não encontrado." };
    }

    if (row.role === "company_admin") {
        return {
            error: "Administradores já têm acesso amplo; altere o papel para operador para usar permissões granulares.",
        };
    }

    const uniqueActions = [...new Set(actions)] as PermissionAction[];

    if (uniqueActions.length === 0) {
        await deleteCompanyUserPermission(companyUserId, slug);
    } else {
        await upsertCompanyUserPermission(companyUserId, slug, uniqueActions);
    }

    revalidatePath("/company/usuarios");
    return { success: true };
}
