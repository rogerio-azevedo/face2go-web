'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type { CreateRegistrationLinkBody } from '@/lib/registration-link-schedule';

export async function approveCompanyRegistrationAction(
    clientId: string,
    registrationId: string,
): Promise<{ success: true } | { error: string }> {
    const cid = z.string().uuid().safeParse(clientId);
    const rid = z.string().uuid().safeParse(registrationId);
    if (!cid.success || !rid.success) return { error: 'ID inválido.' };
    try {
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/registrations/${rid.data}/approve`,
            { method: 'POST' },
        );
        const data = await parseResponseJson(res);
        if (!res.ok) return { error: nestErrorMessage(data) };
        revalidatePath(`/company/clientes/${cid.data}/usuarios`);
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function rejectCompanyRegistrationAction(
    clientId: string,
    registrationId: string,
    notes?: string | null,
): Promise<{ success: true } | { error: string }> {
    const cid = z.string().uuid().safeParse(clientId);
    const rid = z.string().uuid().safeParse(registrationId);
    if (!cid.success || !rid.success) return { error: 'ID inválido.' };
    try {
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/registrations/${rid.data}/reject`,
            {
                method: 'POST',
                body: JSON.stringify({ notes: notes?.trim() || null }),
            },
        );
        const data = await parseResponseJson(res);
        if (!res.ok) return { error: nestErrorMessage(data) };
        revalidatePath(`/company/clientes/${cid.data}/usuarios`);
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function getCompanyRegistrationFaceUrlAction(
    clientId: string,
    registrationId: string,
): Promise<{ url: string } | { error: string }> {
    const cid = z.string().uuid().safeParse(clientId);
    const rid = z.string().uuid().safeParse(registrationId);
    if (!cid.success || !rid.success) return { error: 'ID inválido.' };
    try {
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/registrations/${rid.data}/face-url`,
        );
        const data = await parseResponseJson(res);
        if (!res.ok) return { error: nestErrorMessage(data) };
        return { url: (data as { url: string }).url };
    } catch {
        return { error: 'Sem permissão.' };
    }
}

export async function createCompanyRegistrationLinkAction(
    clientId: string,
    body: CreateRegistrationLinkBody,
): Promise<
    | { success: true; registrationUrl: string; code: string; id: string }
    | { error: string }
> {
    const cid = z.string().uuid().safeParse(clientId);
    if (!cid.success) return { error: 'Cliente inválido.' };
    try {
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/registration-links`,
            { method: 'POST', body: JSON.stringify(body) },
        );
        const data = await parseResponseJson(res);
        if (!res.ok) return { error: nestErrorMessage(data) };
        const row = data as {
            id: string;
            code: string;
            registrationUrl: string;
        };
        revalidatePath(`/company/clientes/${cid.data}/usuarios`);
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

export async function deactivateCompanyRegistrationLinkAction(
    clientId: string,
    linkId: string,
): Promise<{ success: true } | { error: string }> {
    const cid = z.string().uuid().safeParse(clientId);
    const lid = z.string().uuid().safeParse(linkId);
    if (!cid.success || !lid.success) return { error: 'IDs inválidos.' };
    try {
        const res = await apiFetchAuthed(
            `/api/clients/${cid.data}/registration-links/${lid.data}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ isActive: false }),
            },
        );
        const data = await parseResponseJson(res);
        if (!res.ok) return { error: nestErrorMessage(data) };
        revalidatePath(`/company/clientes/${cid.data}/usuarios`);
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}
