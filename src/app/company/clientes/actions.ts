'use server';

import { revalidatePath } from 'next/cache';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import {
    createClientSchema,
    updateClientSchema,
} from '@/lib/validations/clients';
import { ZodError } from 'zod';
import { z } from 'zod';

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return 'Dados inválidos.';
}

export async function createClientAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsed = createClientSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const res = await apiFetchAuthed('/api/clients', {
            method: 'POST',
            body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/clientes');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function updateClientAction(
    clientId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const pid = z.string().uuid().safeParse(clientId);
        if (!pid.success) {
            return { error: 'Cliente inválido.' };
        }

        const parsed = updateClientSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const d = parsed.data;
        if (
            d.name === undefined &&
            d.type === undefined &&
            d.cnpj === undefined &&
            d.phone === undefined &&
            d.email === undefined &&
            d.logoUrl === undefined &&
            d.timezoneOffsetMinutes === undefined &&
            d.isActive === undefined
        ) {
            return { error: 'Nada para atualizar.' };
        }

        const res = await apiFetchAuthed(`/api/clients/${pid.data}`, {
            method: 'PATCH',
            body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/clientes');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

const toggleActiveSchema = z.object({
    clientId: z.string().uuid(),
    isActive: z.boolean(),
});

export async function toggleClientActiveAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsed = toggleActiveSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const { clientId, isActive } = parsed.data;

        const res = await apiFetchAuthed(`/api/clients/${clientId}/active`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive }),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/clientes');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function ensureClientDisplayTokenAction(
    clientId: string,
): Promise<
    | { token: string; shortCode: string }
    | { error: string }
> {
    try {
        const pid = z.string().uuid().safeParse(clientId);
        if (!pid.success) {
            return { error: 'Cliente inválido.' };
        }

        const res = await apiFetchAuthed(
            `/api/clients/${pid.data}/display-token`,
        );

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        const json = (await parseResponseJson(res)) as {
            token?: unknown;
            shortCode?: unknown;
        };
        const token =
            typeof json.token === 'string' ? json.token.trim() : '';
        const shortCode =
            typeof json.shortCode === 'string' ? json.shortCode.trim() : '';

        if (!token) {
            return { error: 'Token não retornado pela API.' };
        }

        return { token, shortCode };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function regenerateClientDisplayTokenAction(
    clientId: string,
): Promise<
    | { token: string; shortCode: string }
    | { error: string }
> {
    try {
        const pid = z.string().uuid().safeParse(clientId);
        if (!pid.success) {
            return { error: 'Cliente inválido.' };
        }

        const res = await apiFetchAuthed(
            `/api/clients/${pid.data}/display-token/regenerate`,
            { method: 'POST' },
        );

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        const json = (await parseResponseJson(res)) as {
            token?: unknown;
            shortCode?: unknown;
        };
        const token =
            typeof json.token === 'string' ? json.token.trim() : '';
        const shortCode =
            typeof json.shortCode === 'string' ? json.shortCode.trim() : '';

        if (!token) {
            return { error: 'Token não retornado pela API.' };
        }

        return { token, shortCode };
    } catch {
        return { error: 'Sem permissão.' };
    }
}
