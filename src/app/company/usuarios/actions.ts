'use server';

import { revalidatePath } from 'next/cache';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import { ALL_FEATURES, type FeatureSlug, type PermissionAction } from '@/lib/features';
import { ZodError } from 'zod';
import { z } from 'zod';

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return 'Dados inválidos.';
}

const roleSchema = z.enum(['company_admin', 'company_operator']);

const generateCompanyInviteSchema = z.object({
    role: roleSchema,
});

export async function generateCompanyInviteAction(
    input: unknown,
): Promise<{ success: true; code: string } | { success: false; error: string }> {
    try {
        const parsed = generateCompanyInviteSchema.safeParse(input);
        if (!parsed.success) {
            return { success: false, error: zodFirstMessage(parsed.error) };
        }

        const res = await apiFetchAuthed('/api/company-users/invite-links', {
            method: 'POST',
            body: JSON.stringify(parsed.data),
        });
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { success: false, error: nestErrorMessage(data) };
        }

        revalidatePath('/company/usuarios');
        return { success: true, code: (data as { code: string }).code };
    } catch {
        return { success: false, error: 'Sem permissão.' };
    }
}

const updateRoleSchema = z.object({
    companyUserId: z.string().uuid(),
    role: roleSchema,
});

export async function updateCompanyMemberRoleAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsed = updateRoleSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const { companyUserId, role } = parsed.data;

        const res = await apiFetchAuthed(
            `/api/company-users/${companyUserId}/role`,
            {
                method: 'PATCH',
                body: JSON.stringify({ role }),
            },
        );

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/usuarios');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

const toggleActiveSchema = z.object({
    companyUserId: z.string().uuid(),
    isActive: z.boolean(),
});

export async function toggleCompanyMemberActiveAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsed = toggleActiveSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const { companyUserId, isActive } = parsed.data;

        const res = await apiFetchAuthed(
            `/api/company-users/${companyUserId}/active`,
            {
                method: 'PATCH',
                body: JSON.stringify({ isActive }),
            },
        );

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/usuarios');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
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
    try {
        const parsed = profileSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const { companyUserId, name, jobTitle, phone } = parsed.data;

        const body: Record<string, unknown> = {};
        if (name !== undefined) body.name = name;
        if (jobTitle !== undefined) body.jobTitle = jobTitle;
        if (phone !== undefined) body.phone = phone;

        const res = await apiFetchAuthed(
            `/api/company-users/${companyUserId}/profile`,
            {
                method: 'PATCH',
                body: JSON.stringify(body),
            },
        );

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/usuarios');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

const permissionsSchema = z.object({
    companyUserId: z.string().uuid(),
    featureSlug: z.string(),
    actions: z.array(
        z.enum(['can_read', 'can_create', 'can_update', 'can_delete']),
    ),
});

export async function updateCompanyMemberPermissionsAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsed = permissionsSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const { companyUserId, featureSlug, actions } = parsed.data;

        if (!ALL_FEATURES.some((f) => f.slug === featureSlug)) {
            return { error: 'Módulo inválido.' };
        }

        const slug = featureSlug as FeatureSlug;
        const uniqueActions = [...new Set(actions)] as PermissionAction[];

        const res = await apiFetchAuthed(
            `/api/company-users/${companyUserId}/permissions`,
            {
                method: 'PATCH',
                body: JSON.stringify({
                    featureSlug: slug,
                    actions: uniqueActions,
                }),
            },
        );

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/usuarios');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}
