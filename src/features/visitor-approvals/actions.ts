'use server';

import { z } from 'zod';
import { zodFirstMessage } from '@/lib/actions/zod-utils';
import { revalidatePath } from 'next/cache';
import {
    apiFetchAuthed,
    apiFetchPublic,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type {
    VisitorApprovalHistory,
    VisitorApprovalPreview,
    VisitorApprovalResult,
    VisitorApprovalTarget,
} from './types';
import type { components } from '@/types/api.generated';

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function publicRequest<T>(
    token: string,
    suffix = '',
    body?: unknown,
): Promise<Result<T>> {
    if (!/^[a-f0-9]{64}$/.test(token))
        return { ok: false, error: 'Link inválido.' };
    try {
        const res = await apiFetchPublic(
            `/api/visitor-approvals/${token}${suffix}`,
            {
                cache: 'no-store',
                ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
            },
        );
        const data = await parseResponseJson(res);
        if (!res.ok) return { ok: false, error: nestErrorMessage(data) };
        return { ok: true, data: data as T };
    } catch {
        return {
            ok: false,
            error: 'Não foi possível acessar a autorização. Tente novamente.',
        };
    }
}

export async function previewVisitorApproval(token: string) {
    return publicRequest<VisitorApprovalPreview>(token);
}
export async function acceptVisitorApproval(
    token: string,
    input: components['schemas']['AcceptVisitorApprovalDto'],
) {
    const parsed = z.object({ cpf: z.string().min(11).max(32), agreed: z.literal(true), termVersion: z.string().min(1).max(80) }).safeParse(input);
    if (!parsed.success) return { ok: false as const, error: zodFirstMessage(parsed.error) };
    return publicRequest<VisitorApprovalResult>(token, '/accept', parsed.data);
}
export async function revokeOwnVisitorApproval(token: string, cpf: string) {
    return publicRequest<VisitorApprovalResult>(token, '/revoke', { cpf });
}

function pathFor(target: VisitorApprovalTarget) {
    if (!z.uuid().safeParse(target.registrationId).success)
        throw new Error('Cadastro inválido.');
    if (target.variant === 'client')
        return `/api/client/registrations/${target.registrationId}/visitor-approval`;
    if (!z.uuid().safeParse(target.companyClientId).success)
        throw new Error('Cliente inválido.');
    return `/api/clients/${target.companyClientId}/registrations/${target.registrationId}/visitor-approval`;
}

export async function visitorApprovalHistory(
    target: VisitorApprovalTarget,
): Promise<Result<VisitorApprovalHistory>> {
    try {
        const res = await apiFetchAuthed(pathFor(target), {
            cache: 'no-store',
        });
        const data = await parseResponseJson(res);
        return res.ok
            ? { ok: true, data: data as VisitorApprovalHistory }
            : { ok: false, error: nestErrorMessage(data) };
    } catch {
        return {
            ok: false,
            error: 'Não foi possível carregar as autorizações.',
        };
    }
}

export async function manageVisitorApproval(
    target: VisitorApprovalTarget,
    operation: 'regularize' | 'resend' | 'revoke',
    consentId?: string,
    reason?: string,
): Promise<Result<VisitorApprovalResult>> {
    try {
        const path = pathFor(target);
        if (
            operation === 'revoke' &&
            (target.variant !== 'client' ||
                !z.uuid().safeParse(consentId).success)
        )
            return { ok: false, error: 'Aceite inválido.' };
        const suffix =
            operation === 'revoke'
                ? `/consents/${consentId}/revoke`
                : `/${operation}`;
        const res = await apiFetchAuthed(path + suffix, {
            method: 'POST',
            ...(operation === 'revoke'
                ? { body: JSON.stringify({ reason }) }
                : {}),
        });
        const data = await parseResponseJson(res);
        if (res.ok) { revalidatePath('/client/cadastros'); if (target.companyClientId) revalidatePath(`/company/clientes/${target.companyClientId}`); }
        return res.ok
            ? { ok: true, data: data as VisitorApprovalResult }
            : { ok: false, error: nestErrorMessage(data) };
    } catch {
        return { ok: false, error: 'Não foi possível registrar a alteração.' };
    }
}
