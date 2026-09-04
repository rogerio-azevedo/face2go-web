'use server';

import { revalidatePath } from 'next/cache';

import {
    apiFetchAuthed,
    getApiBaseUrl,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import { auth } from '@/auth';
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
): Promise<{ success: true; id: string } | { error: string }> {
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

        const created = (await parseResponseJson(res)) as { id?: string };
        revalidatePath('/company/leitores');
        if (!created.id) {
            return { error: 'Leitor criado sem id.' };
        }
        return { success: true, id: created.id };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export type ProvisionPushResponse = {
    mode?: 'v1' | 'v2';
    applied?: boolean;
};

export async function provisionIntelbrasPushAction(
    readerId: string,
): Promise<{ success: true; mode?: 'v1' | 'v2' } | { error: string }> {
    try {
        const pid = z.string().uuid().safeParse(readerId);
        if (!pid.success) {
            return { error: 'Leitor inválido.' };
        }
        const res = await apiFetchAuthed(
            `/api/readers/${pid.data}/provision-push`,
            { method: 'POST' },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }
        const json = (await parseResponseJson(res)) as ProvisionPushResponse;
        if (!json.applied) {
            return {
                error:
                    'Não foi possível alcançar o leitor. Confira IP, porta e se ele está ligado. Provisionamento de Pindorama só funciona a partir do server de prod.',
            };
        }
        return { success: true, mode: json.mode };
    } catch {
        return { error: 'Não foi possível alcançar o leitor.' };
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

export type DeviceUserPersonType =
    | "responsible"
    | "student"
    | "member"
    | "guest";

export type DeviceUser = {
    UserID: string;
    CardName: string;
    CardNo: string;
    ValidDateStart?: string;
    ValidDateEnd?: string;
    HasFace?: boolean | null;
    inSystem: boolean;
    systemName: string | null;
    personType: DeviceUserPersonType | null;
    nameMismatch: boolean;
};

export type DeviceUsersListResult = {
    totalCount: number;
    found: number;
    records: DeviceUser[];
    clientType?: string;
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
        return {
            ok: true,
            data: {
                ...data,
                records: (data.records ?? []).map((row) => ({
                    ...row,
                    inSystem: row.inSystem === true,
                    systemName: row.systemName ?? null,
                    personType: row.personType ?? null,
                    nameMismatch: row.nameMismatch === true,
                })),
            },
        };
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

export type DeviceUsersBatchDeleteResult = {
    deleted: string[];
    failed: { userId: string; error: string }[];
};

export type DeviceUsersWipeAllResult = {
    strategy: "hikvision-all" | "hikvision-fallback" | "intelbras-batch";
    deleted: number;
    failed: { userId: string; error: string }[];
};

export async function batchDeleteDeviceUsersAction(
    readerId: string,
    userIds: string[],
): Promise<
    { ok: true; data: DeviceUsersBatchDeleteResult } | { ok: false; error: string }
> {
    try {
        const res = await apiFetchAuthed(
            `/api/readers/${readerId}/device-users/batch-delete`,
            {
                method: "POST",
                body: JSON.stringify({ userIds }),
            },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as DeviceUsersBatchDeleteResult;
        return { ok: true, data };
    } catch {
        return { ok: false, error: "Erro de comunicação." };
    }
}

export async function wipeAllDeviceUsersAction(
    readerId: string,
): Promise<
    { ok: true; data: DeviceUsersWipeAllResult } | { ok: false; error: string }
> {
    try {
        const res = await apiFetchAuthed(
            `/api/readers/${readerId}/device-users/wipe-all`,
            { method: "POST" },
        );
        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { ok: false, error: nestErrorMessage(data) };
        }
        const data = (await res.json()) as DeviceUsersWipeAllResult;
        return { ok: true, data };
    } catch {
        return { ok: false, error: "Erro de comunicação." };
    }
}

export async function getDeviceUsersSyncAllSseUrlAction(
    readerId: string,
): Promise<{ url: string } | { error: string }> {
    const id = z.string().uuid().safeParse(readerId);
    if (!id.success) return { error: "Leitor inválido." };
    try {
        const session = await auth();
        const token = session?.accessToken;
        if (!token) return { error: "Não autenticado." };
        const base = getApiBaseUrl();
        return {
            url: `${base}/api/readers/${id.data}/device-users/sync-all/progress?token=${encodeURIComponent(token)}`,
        };
    } catch {
        return { error: "Não autenticado." };
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
