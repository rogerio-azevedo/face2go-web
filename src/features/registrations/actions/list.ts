'use server';

import { z } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import {
    buildRegistrationListQuery,
    type RegistrationListParams,
} from '@/lib/pagination';
import type { PaginatedRegistrationsResponse } from '@/types/domain';

function normalizeRegistrationsPage(
    value: unknown,
): PaginatedRegistrationsResponse | null {
    if (!value || typeof value !== 'object') return null;
    const v = value as PaginatedRegistrationsResponse;
    if (!Array.isArray(v.data) || typeof v.total !== 'number') return null;
    const counts = v.counts;
    return {
        data: v.data,
        total: v.total,
        page: typeof v.page === 'number' ? v.page : 1,
        pageSize: typeof v.pageSize === 'number' ? v.pageSize : 20,
        counts: {
            draft: Number(counts?.draft ?? 0),
            approved: Number(counts?.approved ?? 0),
            rejected: Number(counts?.rejected ?? 0),
        },
    };
}

export async function listRegistrationsAction(
    variant: 'company' | 'client',
    params: RegistrationListParams & { companyClientId?: string } = {},
): Promise<
    { ok: true; result: PaginatedRegistrationsResponse } | { ok: false; error: string }
> {
    try {
        const qs = buildRegistrationListQuery(params);
        let path = `/api/client/registrations?${qs}`;
        if (variant === 'company') {
            const cid = z.string().uuid().safeParse(params.companyClientId);
            if (!cid.success) {
                return { ok: false, error: 'Cliente inválido.' };
            }
            path = `/api/clients/${cid.data}/registrations?${qs}`;
        }

        const res = await apiFetchAuthed(path);
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { ok: false, error: nestErrorMessage(data) };
        }
        const result = normalizeRegistrationsPage(data);
        if (!result) {
            return {
                ok: false,
                error: 'Resposta inválida da listagem de cadastros.',
            };
        }
        return { ok: true, result };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}
