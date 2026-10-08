'use server';

import { z } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type { operations } from '@/types/api.generated';

export type ReaderDeviceInfoResult =
    operations['ReadersController_refreshDeviceInfo']['responses'][200]['content']['application/json'];

export async function refreshReaderDeviceInfoAction(
    readerId: string,
): Promise<
    | { ok: true; data: ReaderDeviceInfoResult }
    | { ok: false; error: string }
> {
    const parsed = z.string().uuid().safeParse(readerId);
    if (!parsed.success) return { ok: false, error: 'Leitor inválido.' };

    try {
        const response = await apiFetchAuthed(
            `/api/readers/${parsed.data}/device-info/refresh`,
            { method: 'POST' },
        );
        if (!response.ok) {
            return {
                ok: false,
                error: nestErrorMessage(await parseResponseJson(response)),
            };
        }
        const data = (await parseResponseJson(
            response,
        )) as ReaderDeviceInfoResult;
        return { ok: true, data };
    } catch {
        return {
            ok: false,
            error: 'Não foi possível consultar o equipamento.',
        };
    }
}
