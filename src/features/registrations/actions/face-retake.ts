'use server';

import { z } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';

export type FaceRetakeLinkResult = {
    url: string;
    message: string;
    expiresAt: string;
};

function parseFaceRetakeLink(data: unknown): FaceRetakeLinkResult | null {
    if (!data || typeof data !== 'object') return null;
    const row = data as {
        url?: unknown;
        message?: unknown;
        expiresAt?: unknown;
    };
    if (typeof row.url !== 'string' || typeof row.message !== 'string') {
        return null;
    }
    return {
        url: row.url,
        message: row.message,
        expiresAt: typeof row.expiresAt === 'string' ? row.expiresAt : '',
    };
}

export async function createFaceRetakeLinkAction(
    variant: 'company' | 'client',
    registrationId: string,
    companyClientId?: string,
): Promise<
    { ok: true; result: FaceRetakeLinkResult } | { ok: false; error: string }
> {
    const registration = z.string().uuid().safeParse(registrationId);
    if (!registration.success) {
        return { ok: false, error: 'Cadastro inválido.' };
    }

    let path = `/api/client/registrations/${registration.data}/face-retake-link`;
    if (variant === 'company') {
        const client = z.string().uuid().safeParse(companyClientId);
        if (!client.success) {
            return { ok: false, error: 'Cliente inválido.' };
        }
        path = `/api/clients/${client.data}/registrations/${registration.data}/face-retake-link`;
    }

    try {
        const res = await apiFetchAuthed(path, { method: 'POST' });
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { ok: false, error: nestErrorMessage(data) };
        }
        const result = parseFaceRetakeLink(data);
        if (!result) {
            return { ok: false, error: 'Resposta inválida ao gerar o link.' };
        }
        return { ok: true, result };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}
