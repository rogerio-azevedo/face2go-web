'use server';

import { ZodError, z } from 'zod';

import {
    apiFetchPublic,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type { LoginResponse } from '@/types/auth-context';

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return 'Dados inválidos.';
}

const joinContextSchema = z.object({
    identifier: z.string().min(1),
    password: z.string().min(6),
    invite: z.string().min(4),
});

export async function joinContextAction(
    input: unknown,
): Promise<
    | { success: true; data: LoginResponse }
    | { success: false; error: string }
> {
    const parsed = joinContextSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: zodFirstMessage(parsed.error) };
    }

    try {
        const res = await apiFetchPublic('/api/auth/join-context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed.data),
        });
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { success: false, error: nestErrorMessage(data) };
        }

        return { success: true, data: data as LoginResponse };
    } catch {
        return {
            success: false,
            error: 'Não foi possível vincular o contexto.',
        };
    }
}
