'use server';

import { revalidatePath } from 'next/cache';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import {
    createReaderSchema,
    updateReaderSchema,
} from '@/lib/validations/readers';
import { ZodError } from 'zod';
import { z } from 'zod';

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return 'Dados inválidos.';
}

export async function createReaderAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsed = createReaderSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const res = await apiFetchAuthed('/api/readers', {
            method: 'POST',
            body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/leitores');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function updateReaderAction(
    readerId: string,
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const pid = z.string().uuid().safeParse(readerId);
        if (!pid.success) {
            return { error: 'Leitor inválido.' };
        }

        const parsed = updateReaderSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const d = parsed.data;
        if (
            d.clientId === undefined &&
            d.brand === undefined &&
            d.name === undefined &&
            d.description === undefined &&
            d.ip === undefined &&
            d.port === undefined &&
            d.serialNumber === undefined &&
            d.model === undefined &&
            d.location === undefined &&
            d.isActive === undefined
        ) {
            return { error: 'Nada para atualizar.' };
        }

        const res = await apiFetchAuthed(`/api/readers/${pid.data}`, {
            method: 'PATCH',
            body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/leitores');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

const toggleActiveSchema = z.object({
    readerId: z.string().uuid(),
    isActive: z.boolean(),
});

export async function toggleReaderActiveAction(
    input: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsed = toggleActiveSchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const { readerId, isActive } = parsed.data;

        const res = await apiFetchAuthed(`/api/readers/${readerId}/active`, {
            method: 'PATCH',
            body: JSON.stringify({ isActive }),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidatePath('/company/leitores');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}
