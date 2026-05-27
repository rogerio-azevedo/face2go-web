'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';

const clientInviteRoleSchema = z.enum(['client_admin', 'client_operator']);

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
