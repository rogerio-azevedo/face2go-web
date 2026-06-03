'use server';

import { revalidatePath } from 'next/cache';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type { ReadersMonitorStatusResponse } from '@/types/domain';
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
            d.isActive === undefined &&
            d.username === undefined &&
            d.password === undefined &&
            d.direction === undefined
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

/** Polling do painel: status de conexão do stream (Intelbras + credenciais). */
export async function fetchReadersMonitorStatusAction(
    clientId?: string | null,
): Promise<
    | { ok: true; data: ReadersMonitorStatusResponse }
    | { ok: false; error: string }
> {
    try {
        const q =
            clientId && clientId.length > 0
                ? `?clientId=${encodeURIComponent(clientId)}`
                : '';
        const res = await apiFetchAuthed(`/api/readers/monitor/status${q}`);
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as ReadersMonitorStatusResponse;
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Sem permissão.' };
    }
}

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

export type DeviceUser = {
    UserID: string;
    CardName: string;
    CardNo: string;
    ValidDateStart?: string;
    ValidDateEnd?: string;
};

export type DeviceUsersListResult = {
    totalCount: number;
    found: number;
    records: DeviceUser[];
};

export async function getDeviceUsersAction(
    readerId: string,
    limit: number,
    offset: number,
    search?: string,
): Promise<{ ok: true; data: DeviceUsersListResult } | { ok: false; error: string }> {
    try {
        const params = new URLSearchParams({
            limit: String(limit),
            offset: String(offset),
        });
        const term = search?.trim();
        if (term) params.set('search', term);
        const res = await apiFetchAuthed(
            `/api/readers/${readerId}/device-users?${params.toString()}`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as DeviceUsersListResult;
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Erro de comunicação.' };
    }
}

export async function removeDeviceUserAction(
    readerId: string,
    userId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const res = await apiFetchAuthed(
            `/api/readers/${readerId}/device-users/${userId}`,
            {
                method: 'DELETE',
            },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        return { success: true };
    } catch {
        return { error: 'Erro de comunicação.' };
    }
}

export async function getDeviceUserFaceAction(
    readerId: string,
    userId: string,
): Promise<{ ok: true; data: { photoBase64: string | null } } | { ok: false; error: string }> {
    try {
        const res = await apiFetchAuthed(
            `/api/readers/${readerId}/device-users/${userId}/face`,
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as { photoBase64: string | null };
        return { ok: true, data };
    } catch {
        return { ok: false, error: 'Erro de comunicação.' };
    }
}
