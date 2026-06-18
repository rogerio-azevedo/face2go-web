'use server';

import { revalidatePath } from 'next/cache';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type { PanicEventItem } from '@/types/panic-events';
import type { ClientMapPoint } from '@/types/client-map-point';
import { normalizeClientMapPointType } from '@/types/client-map-point';

export async function listPanicEventsAction(params?: {
    status?: 'open' | 'claimed' | 'closed';
    page?: number;
    limit?: number;
}): Promise<
    | {
          ok: true;
          data: {
              items: PanicEventItem[];
              page: number;
              limit: number;
              total: number;
              totalPages: number;
          };
      }
    | { ok: false; error: string }
> {
    try {
        const search = new URLSearchParams();
        if (params?.status) search.set('status', params.status);
        if (params?.page) search.set('page', String(params.page));
        if (params?.limit) search.set('limit', String(params.limit));

        const qs = search.toString();
        const res = await apiFetchAuthed(
            `/api/panic-events${qs ? `?${qs}` : ''}`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = await res.json();
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

export async function listClientMapPointsAction(): Promise<
    { ok: true; data: ClientMapPoint[] } | { ok: false; error: string }
> {
    try {
        const res = await apiFetchAuthed('/api/clients/map-points');
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const raw = (await res.json()) as Array<{
            id: string;
            name: string;
            type: string;
            latitude: number;
            longitude: number;
            city: string | null;
            state: string | null;
        }>;
        const data: ClientMapPoint[] = raw.map((row) => ({
            ...row,
            type: normalizeClientMapPointType(row.type),
        }));
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

async function postPanicAction(
    eventId: string,
    action: 'claim' | 'release' | 'close',
    body?: Record<string, unknown>,
): Promise<
    { ok: true; data: PanicEventItem } | { ok: false; error: string }
> {
    try {
        const res = await apiFetchAuthed(
            `/api/panic-events/${encodeURIComponent(eventId)}/${action}`,
            {
                method: 'POST',
                body: body ? JSON.stringify(body) : undefined,
            },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as PanicEventItem;
        revalidatePath('/monitoring');
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

export async function claimPanicEventAction(eventId: string) {
    return postPanicAction(eventId, 'claim');
}

export async function releasePanicEventAction(eventId: string) {
    return postPanicAction(eventId, 'release');
}

export async function closePanicEventAction(
    eventId: string,
    input: { closingReason: string; closingNotes?: string },
) {
    return postPanicAction(eventId, 'close', input);
}
