'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import { zodFirstMessage } from '@/lib/actions/zod-utils';
import { clientAddressFormSchema } from '@/lib/validations/client-addresses';
import type { ClientAddressRow } from '@/types/client-address';
import type { GeocodingSuggestion } from '@/lib/validations/client-addresses';

function revalidateClientAddresses(clientId: string) {
    revalidatePath(`/company/clientes/${clientId}/usuarios`);
    revalidatePath(`/company/clientes/${clientId}/enderecos`);
}

export async function listClientAddressesAction(
    clientId: string,
): Promise<{ ok: true; data: ClientAddressRow[] } | { ok: false; error: string }> {
    try {
        const pid = z.string().uuid().safeParse(clientId);
        if (!pid.success) return { ok: false, error: 'Cliente inválido.' };

        const res = await apiFetchAuthed(
            `/api/clients/${encodeURIComponent(clientId)}/addresses`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as ClientAddressRow[];
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

export async function createClientAddressAction(
    clientId: string,
    input: unknown,
): Promise<{ ok: true; data: ClientAddressRow } | { ok: false; error: string }> {
    try {
        const pid = z.string().uuid().safeParse(clientId);
        if (!pid.success) return { ok: false, error: 'Cliente inválido.' };

        const parsed = clientAddressFormSchema.safeParse(input);
        if (!parsed.success) {
            return { ok: false, error: zodFirstMessage(parsed.error) };
        }

        const res = await apiFetchAuthed(
            `/api/clients/${encodeURIComponent(clientId)}/addresses`,
            {
                method: 'POST',
                body: JSON.stringify(parsed.data),
            },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as ClientAddressRow;
        revalidateClientAddresses(clientId);
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

export async function updateClientAddressAction(
    clientId: string,
    addressId: string,
    input: unknown,
): Promise<{ ok: true; data: ClientAddressRow } | { ok: false; error: string }> {
    try {
        const ids = z
            .object({
                clientId: z.string().uuid(),
                addressId: z.string().uuid(),
            })
            .safeParse({ clientId, addressId });
        if (!ids.success) return { ok: false, error: 'Dados inválidos.' };

        const parsed = clientAddressFormSchema.partial().safeParse(input);
        if (!parsed.success) {
            return { ok: false, error: zodFirstMessage(parsed.error) };
        }

        const res = await apiFetchAuthed(
            `/api/clients/${encodeURIComponent(clientId)}/addresses/${encodeURIComponent(addressId)}`,
            {
                method: 'PATCH',
                body: JSON.stringify(parsed.data),
            },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as ClientAddressRow;
        revalidateClientAddresses(clientId);
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

export async function deleteClientAddressAction(
    clientId: string,
    addressId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        const ids = z
            .object({
                clientId: z.string().uuid(),
                addressId: z.string().uuid(),
            })
            .safeParse({ clientId, addressId });
        if (!ids.success) return { ok: false, error: 'Dados inválidos.' };

        const res = await apiFetchAuthed(
            `/api/clients/${encodeURIComponent(clientId)}/addresses/${encodeURIComponent(addressId)}`,
            { method: 'DELETE' },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        revalidateClientAddresses(clientId);
        return { ok: true };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

export async function setPrimaryClientAddressAction(
    clientId: string,
    addressId: string,
): Promise<{ ok: true; data: ClientAddressRow } | { ok: false; error: string }> {
    try {
        const ids = z
            .object({
                clientId: z.string().uuid(),
                addressId: z.string().uuid(),
            })
            .safeParse({ clientId, addressId });
        if (!ids.success) return { ok: false, error: 'Dados inválidos.' };

        const res = await apiFetchAuthed(
            `/api/clients/${encodeURIComponent(clientId)}/addresses/${encodeURIComponent(addressId)}/set-primary`,
            { method: 'POST' },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as ClientAddressRow;
        revalidateClientAddresses(clientId);
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

export async function geocodingAutocompleteAction(
    q: string,
    at?: string,
): Promise<
    | { ok: true; items: GeocodingSuggestion[] }
    | { ok: false; error: string; unavailable?: boolean }
> {
    try {
        const query = z.string().trim().min(2).safeParse(q);
        if (!query.success) return { ok: true, items: [] };

        const params = new URLSearchParams({ q: query.data });
        if (at) params.set('at', at);

        const res = await apiFetchAuthed(`/api/geocoding/autocomplete?${params}`);
        if (!res.ok) {
            const data = await parseResponseJson(res);
            const message = nestErrorMessage(data);
            return {
                ok: false,
                error: message,
                unavailable: res.status === 503,
            };
        }
        const data = (await res.json()) as { items: GeocodingSuggestion[] };
        return { ok: true, items: data.items ?? [] };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

export async function geocodingGeocodeAction(
    q: string,
): Promise<
    | { ok: true; items: GeocodingSuggestion[] }
    | { ok: false; error: string; unavailable?: boolean }
> {
    try {
        const query = z.string().trim().min(2).safeParse(q);
        if (!query.success) return { ok: true, items: [] };

        const res = await apiFetchAuthed(
            `/api/geocoding/geocode?${new URLSearchParams({ q: query.data })}`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return {
                ok: false,
                error: nestErrorMessage(data),
                unavailable: res.status === 503,
            };
        }
        const data = (await res.json()) as { items: GeocodingSuggestion[] };
        return { ok: true, items: data.items ?? [] };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

export async function geocodingReverseAction(
    latitude: number,
    longitude: number,
): Promise<
    | { ok: true; item: GeocodingSuggestion | null }
    | { ok: false; error: string; unavailable?: boolean }
> {
    try {
        const at = `${latitude},${longitude}`;
        const res = await apiFetchAuthed(
            `/api/geocoding/reverse?${new URLSearchParams({ at })}`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return {
                ok: false,
                error: nestErrorMessage(data),
                unavailable: res.status === 503,
            };
        }
        const data = (await res.json()) as { item: GeocodingSuggestion | null };
        return { ok: true, item: data.item };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

export async function geocodingLookupAction(
    id: string,
): Promise<
    | { ok: true; item: GeocodingSuggestion | null }
    | { ok: false; error: string; unavailable?: boolean }
> {
    try {
        const res = await apiFetchAuthed(
            `/api/geocoding/lookup?${new URLSearchParams({ id })}`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return {
                ok: false,
                error: nestErrorMessage(data),
                unavailable: res.status === 503,
            };
        }
        const data = (await res.json()) as { item: GeocodingSuggestion | null };
        return { ok: true, item: data.item };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}
