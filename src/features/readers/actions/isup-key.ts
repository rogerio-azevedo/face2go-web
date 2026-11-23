'use server';

import { z } from 'zod';

import { zodFirstMessage } from '@/lib/actions/zod-utils';
import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type { paths } from '@/types/api.generated';

type IsupKeyPath = paths['/api/readers/{readerId}/isup-key'];
type IsupKeyUpdate =
    IsupKeyPath['put']['requestBody']['content']['application/json'];

const readerIdSchema = z.uuid('Leitor inválido.');
const keySchema = z
    .string()
    .regex(
        /^[!-~]{1,32}$/,
        'Use de 1 a 32 caracteres ASCII imprimíveis, sem espaços.',
    )
    .optional();

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function requestKey<T>(
    readerId: string,
    init?: RequestInit,
): Promise<Result<T>> {
    const id = readerIdSchema.safeParse(readerId);
    if (!id.success) return { ok: false, error: zodFirstMessage(id.error) };

    try {
        const res = await apiFetchAuthed(`/api/readers/${id.data}/isup-key`, {
            ...init,
            cache: 'no-store',
        });
        const data = await parseResponseJson(res);
        if (!res.ok) return { ok: false, error: nestErrorMessage(data) };
        return { ok: true, data: data as T };
    } catch {
        return { ok: false, error: 'Não foi possível acessar a chave ISUP.' };
    }
}

export async function revealReaderIsupKeyAction(readerId: string) {
    return requestKey<
        IsupKeyPath['get']['responses'][200]['content']['application/json']
    >(readerId);
}

export async function setReaderIsupKeyAction(readerId: string, key?: string) {
    const parsed = keySchema.safeParse(key);
    if (!parsed.success)
        return { ok: false, error: zodFirstMessage(parsed.error) } as const;
    const body: IsupKeyUpdate = { key: parsed.data };
    return requestKey<
        IsupKeyPath['put']['responses'][200]['content']['application/json']
    >(readerId, { method: 'PUT', body: JSON.stringify(body) });
}
