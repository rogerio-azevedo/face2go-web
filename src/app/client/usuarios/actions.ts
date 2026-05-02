'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { auth } from '@/auth';

import {
    apiFetchAuthed,
    getApiBaseUrl,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type { CreateRegistrationLinkBody } from '@/lib/registration-link-schedule';

export async function createClientRegistrationLinkAction(
    body: CreateRegistrationLinkBody,
): Promise<
    | {
          success: true;
          registrationUrl: string;
          code: string;
          id: string;
      }
    | { error: string }
> {
    try {
        const res = await apiFetchAuthed('/api/client/registration-links', {
            method: 'POST',
            body: JSON.stringify(body),
        });
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { error: nestErrorMessage(data) };
        }
        const row = data as {
            id: string;
            code: string;
            registrationUrl: string;
        };
        revalidatePath('/client/usuarios');
        return {
            success: true,
            id: row.id,
            code: row.code,
            registrationUrl: row.registrationUrl,
        };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function deactivateClientRegistrationLinkAction(
    linkId: string,
): Promise<{ success: true } | { error: string }> {
    const pid = z.string().uuid().safeParse(linkId);
    if (!pid.success) {
        return { error: 'Link inválido.' };
    }
    try {
        const res = await apiFetchAuthed(
            `/api/client/registration-links/${pid.data}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ isActive: false }),
            },
        );
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { error: nestErrorMessage(data) };
        }
        revalidatePath('/client/usuarios');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function approveClientRegistrationAction(
    registrationId: string,
): Promise<{ success: true } | { error: string }> {
    const id = z.string().uuid().safeParse(registrationId);
    if (!id.success) return { error: 'ID inválido.' };
    try {
        const res = await apiFetchAuthed(
            `/api/client/registrations/${id.data}/approve`,
            { method: 'POST' },
        );
        const data = await parseResponseJson(res);
        if (!res.ok) return { error: nestErrorMessage(data) };
        revalidatePath('/client/usuarios');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function getClientRegistrationFaceUrlAction(
    registrationId: string,
): Promise<{ url: string } | { error: string }> {
    const id = z.string().uuid().safeParse(registrationId);
    if (!id.success) return { error: 'ID inválido.' };
    try {
        const res = await apiFetchAuthed(
            `/api/client/registrations/${id.data}/face-url`,
        );
        const data = await parseResponseJson(res);
        if (!res.ok) return { error: nestErrorMessage(data) };
        return { url: (data as { url: string }).url };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function rejectClientRegistrationAction(
    registrationId: string,
    notes?: string | null,
): Promise<{ success: true } | { error: string }> {
    const id = z.string().uuid().safeParse(registrationId);
    if (!id.success) return { error: 'ID inválido.' };
    try {
        const res = await apiFetchAuthed(
            `/api/client/registrations/${id.data}/reject`,
            {
                method: 'POST',
                body: JSON.stringify({ notes: notes?.trim() || null }),
            },
        );
        const data = await parseResponseJson(res);
        if (!res.ok) return { error: nestErrorMessage(data) };
        revalidatePath('/client/usuarios');
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function syncClientRegistrationFaceAction(
    registrationId: string,
): Promise<
    | {
          success: true;
          deviceSyncStatus: string;
          deviceSyncError: string | null;
      }
    | { error: string }
> {
    const id = z.string().uuid().safeParse(registrationId);
    if (!id.success) return { error: 'ID inválido.' };
    try {
        const res = await apiFetchAuthed(`/api/client/faces/${id.data}/sync`, {
            method: 'POST',
        });
        const data = (await parseResponseJson(res)) as {
            deviceSyncStatus?: string;
            deviceSyncError?: string | null;
        };
        if (!res.ok) return { error: nestErrorMessage(data) };
        revalidatePath('/client/usuarios');
        return {
            success: true,
            deviceSyncStatus: String(data.deviceSyncStatus ?? ''),
            deviceSyncError: data.deviceSyncError ?? null,
        };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function getClientFaceSyncProgressSseUrlAction(): Promise<
    { url: string } | { error: string }
> {
    try {
        const session = await auth();
        const token = session?.accessToken;
        if (!token) return { error: 'Não autenticado.' };
        const base = getApiBaseUrl();
        const url = `${base}/api/client/faces/sync-all/progress?token=${encodeURIComponent(token)}`;
        return { url };
    } catch {
        return { error: 'Não autenticado.' };
    }
}
