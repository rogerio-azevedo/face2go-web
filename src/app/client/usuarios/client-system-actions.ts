'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';

const clientInviteRoleSchema = z.enum(['client_admin', 'client_operator']);

export type ClientSystemUserRow = {
    clientUserId: string;
    userId: string;
    email: string;
    name: string | null;
    role: 'client_admin' | 'client_operator';
    isActive: boolean;
};

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
