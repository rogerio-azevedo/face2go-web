'use server';

import { ZodError } from 'zod';

import {
    apiFetchPublic,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import { registerSchema } from '@/lib/validations/register';

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return 'Dados inválidos.';
}

export type InvitePreview = {
    role: 'company_admin' | 'company_operator';
    companyName: string;
} | null;

export async function getInvitePreviewAction(code: string): Promise<InvitePreview> {
    const trimmed = code?.trim() ?? '';
    if (trimmed.length < 4) return null;

    try {
        const res = await apiFetchPublic(
            `/api/invite-links/${encodeURIComponent(trimmed)}`,
        );

        if (!res.ok) return null;

        const data = await res.json();
        if (!data || typeof data !== 'object') return null;

        return data as Exclude<InvitePreview, null>;
    } catch {
        return null;
    }
}

export async function registerWithInviteAction(
    input: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: zodFirstMessage(parsed.error) };
    }

    try {
        const res = await apiFetchPublic('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { success: false, error: nestErrorMessage(data) };
        }

        return { success: true };
    } catch {
        return {
            success: false,
            error: 'Não foi possível concluir o cadastro.',
        };
    }
}
