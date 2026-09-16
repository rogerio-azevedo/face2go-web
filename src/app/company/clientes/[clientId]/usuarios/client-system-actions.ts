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

export async function listClientInviteLinksAction(clientId: string): Promise<
    { success: true; invites: ClientInviteLinkRow[] } | { success: false; error: string }
> {
    const parsed = z.string().uuid().safeParse(clientId);
    if (!parsed.success) {
        return { success: false, error: 'Cliente inválido.' };
    }

    try {
        const res = await apiFetchAuthed(
            `/api/clients/${parsed.data}/invite-links`,
        );
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

export async function generateClientInviteFromCompanyAction(input: {
    clientId: string;
    role: 'client_admin' | 'client_operator';
}): Promise<
    { success: true; code: string } | { success: false; error: string }
> {
    const parsed = z
        .object({
            clientId: z.string().uuid(),
            role: clientInviteRoleSchema,
        })
        .safeParse(input);

    if (!parsed.success) {
        return { success: false, error: 'Dados inválidos.' };
    }

    try {
        const res = await apiFetchAuthed(
            `/api/clients/${parsed.data.clientId}/invite-links`,
            {
                method: 'POST',
                body: JSON.stringify({ role: parsed.data.role }),
            },
        );
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { success: false, error: nestErrorMessage(data) };
        }

        revalidatePath(`/company/clientes/${parsed.data.clientId}/usuarios`);
        return { success: true, code: (data as { code: string }).code };
    } catch {
        return { success: false, error: 'Sem permissão.' };
    }
}

export async function fetchClientSystemUsersAction(clientId: string) {
    const parsed = z.string().uuid().safeParse(clientId);
    if (!parsed.success) {
        return { users: [] as ClientSystemUserRow[] };
    }

    try {
        const res = await apiFetchAuthed(
            `/api/clients/${parsed.data}/client-users`,
        );
        if (!res.ok) {
            return { users: [] as ClientSystemUserRow[] };
        }
        const data = (await res.json()) as { users: ClientSystemUserRow[] };
        return { users: data.users ?? [] };
    } catch {
        return { users: [] as ClientSystemUserRow[] };
    }
}

export type ClientSystemUserRow = {
    clientUserId: string;
    userId: string;
    email: string;
    name: string | null;
    role: 'client_admin' | 'client_operator';
    isActive: boolean;
};

const clientUserRoleSchema = z.enum(['client_admin', 'client_operator']);

const manageClientUserSchema = z.object({
    clientId: z.string().uuid(),
    clientUserId: z.string().uuid(),
});

async function patchClientUser(
    path: string,
    body: unknown,
    clientId: string,
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
        revalidatePath('/company/usuarios');
        revalidatePath(`/company/clientes/${clientId}/usuarios`);
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function updateClientSystemUserProfileAction(input: unknown) {
    const parsed = manageClientUserSchema
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
    const { clientId, clientUserId, name, email } = parsed.data;
    return patchClientUser(
        `/api/clients/${clientId}/client-users/${clientUserId}/profile`,
        { name, email },
        clientId,
    );
}

export async function updateClientSystemUserRoleAction(input: unknown) {
    const parsed = manageClientUserSchema
        .extend({ role: clientUserRoleSchema })
        .safeParse(input);
    if (!parsed.success) {
        return { error: 'Dados inválidos.' };
    }
    const { clientId, clientUserId, role } = parsed.data;
    return patchClientUser(
        `/api/clients/${clientId}/client-users/${clientUserId}/role`,
        { role },
        clientId,
    );
}

export async function toggleClientSystemUserActiveAction(input: unknown) {
    const parsed = manageClientUserSchema
        .extend({ isActive: z.boolean() })
        .safeParse(input);
    if (!parsed.success) {
        return { error: 'Dados inválidos.' };
    }
    const { clientId, clientUserId, isActive } = parsed.data;
    return patchClientUser(
        `/api/clients/${clientId}/client-users/${clientUserId}/active`,
        { isActive },
        clientId,
    );
}

export async function setClientSystemUserPasswordAction(input: unknown) {
    const parsed = manageClientUserSchema
        .extend({
            password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
        })
        .safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
    }
    const { clientId, clientUserId, password } = parsed.data;
    return patchClientUser(
        `/api/clients/${clientId}/client-users/${clientUserId}/password`,
        { password },
        clientId,
    );
}
