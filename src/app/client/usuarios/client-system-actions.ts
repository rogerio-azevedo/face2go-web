'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';

const clientInviteRoleSchema = z.enum(['client_admin', 'client_operator']);

export type ClientInviteLinkRow = {
    id: string;
    code: string;
    role: 'client_admin' | 'client_operator';
    usedCount: number;
    isActive: boolean;
    expiresAt: string | null;
    createdAt: string;
};

export type ClientSystemUserRow = {
    clientUserId: string;
    userId: string;
    email: string;
    name: string | null;
    role: 'client_admin' | 'client_operator';
    isActive: boolean;
};

export async function listClientSelfInviteLinksAction(): Promise<
    { success: true; invites: ClientInviteLinkRow[] } | { success: false; error: string }
> {
    try {
        const res = await apiFetchAuthed('/api/client/invite-links');
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { success: false, error: nestErrorMessage(data) };
        }

        const invites =
            (data as { invites?: ClientInviteLinkRow[] }).invites ?? [];
        return { success: true, invites };
    } catch {
        return { success: false, error: 'Sem permissão.' };
    }
}

export async function generateClientSelfInviteAction(input: {
    role: 'client_admin' | 'client_operator';
}): Promise<
    { success: true; code: string } | { success: false; error: string }
> {
    const parsed = z
        .object({ role: clientInviteRoleSchema })
        .safeParse(input);

    if (!parsed.success) {
        return { success: false, error: 'Dados inválidos.' };
    }

    try {
        const res = await apiFetchAuthed('/api/client/invite-links', {
            method: 'POST',
            body: JSON.stringify(parsed.data),
        });
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { success: false, error: nestErrorMessage(data) };
        }

        revalidatePath('/client/usuarios');
        return { success: true, code: (data as { code: string }).code };
    } catch {
        return { success: false, error: 'Sem permissão.' };
    }
}

export async function fetchClientSelfSystemUsersAction(): Promise<{
    users: ClientSystemUserRow[];
}> {
    try {
        const res = await apiFetchAuthed('/api/client/client-users');
        if (!res.ok) {
            return { users: [] };
        }
        const data = (await res.json()) as { users: ClientSystemUserRow[] };
        return { users: data.users ?? [] };
    } catch {
        return { users: [] };
    }
}

const manageSelfClientUserSchema = z.object({
    clientUserId: z.string().uuid(),
});

async function patchSelfClientUser(
    path: string,
    body: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const res = await apiFetchAuthed(path, {
            method: 'PATCH',
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        revalidatePath('/client/usuarios');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function updateClientSelfSystemUserProfileAction(input: unknown) {
    const parsed = manageSelfClientUserSchema
        .extend({
            name: z.string().trim().min(2).max(255).optional(),
            email: z
                .string()
                .email('E-mail inválido.')
                .transform((value) => value.trim().toLowerCase())
                .optional(),
        })
        .safeParse(input);
    if (!parsed.success) {
        return { error: 'Dados inválidos.' };
    }
    const { clientUserId, name, email } = parsed.data;
    return patchSelfClientUser(
        `/api/client/client-users/${clientUserId}/profile`,
        { name, email },
    );
}

export async function updateClientSelfSystemUserRoleAction(input: unknown) {
    const parsed = manageSelfClientUserSchema
        .extend({
            role: z.enum(['client_admin', 'client_operator']),
        })
        .safeParse(input);
    if (!parsed.success) {
        return { error: 'Dados inválidos.' };
    }
    const { clientUserId, role } = parsed.data;
    return patchSelfClientUser(
        `/api/client/client-users/${clientUserId}/role`,
        { role },
    );
}

export async function toggleClientSelfSystemUserActiveAction(input: unknown) {
    const parsed = manageSelfClientUserSchema
        .extend({ isActive: z.boolean() })
        .safeParse(input);
    if (!parsed.success) {
        return { error: 'Dados inválidos.' };
    }
    const { clientUserId, isActive } = parsed.data;
    return patchSelfClientUser(
        `/api/client/client-users/${clientUserId}/active`,
        { isActive },
    );
}

export async function setClientSelfSystemUserPasswordAction(input: unknown) {
    const parsed = manageSelfClientUserSchema
        .extend({
            password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
        })
        .safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
    }
    const { clientUserId, password } = parsed.data;
    return patchSelfClientUser(
        `/api/client/client-users/${clientUserId}/password`,
        { password },
    );
}
