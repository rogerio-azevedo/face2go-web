'use server';

import { z } from 'zod';
import {
    apiFetchAuthed,
    apiFetchPublic,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type {
    ChildApprovalHistory,
    ChildApprovalPreview,
    ChildApprovalResult,
    ChildApprovalTarget,
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
            `/api/child-approvals/${token}${suffix}`,
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

export async function previewChildApproval(token: string) {
    return publicRequest<ChildApprovalPreview>(token);
}
export async function acceptChildApproval(
    token: string,
    input: components['schemas']['AcceptChildApprovalDto'],
) {
    return publicRequest<ChildApprovalResult>(token, '/accept', input);
}
export async function revokeOwnChildApproval(token: string, cpf: string) {
    return publicRequest<ChildApprovalResult>(token, '/revoke', { cpf });
}

function pathFor(target: ChildApprovalTarget) {
    if (!z.uuid().safeParse(target.registrationId).success)
        throw new Error('Cadastro inválido.');
    if (target.variant === 'client')
        return `/api/client/registrations/${target.registrationId}/child-approval`;
    if (!z.uuid().safeParse(target.companyClientId).success)
        throw new Error('Cliente inválido.');
    return `/api/clients/${target.companyClientId}/registrations/${target.registrationId}/child-approval`;
}

export async function childApprovalHistory(
    target: ChildApprovalTarget,
): Promise<Result<ChildApprovalHistory>> {
    try {
        const res = await apiFetchAuthed(pathFor(target), {
            cache: 'no-store',
        });
        const data = await parseResponseJson(res);
        return res.ok
            ? { ok: true, data: data as ChildApprovalHistory }
            : { ok: false, error: nestErrorMessage(data) };
    } catch {
        return {
            ok: false,
            error: 'Não foi possível carregar as autorizações.',
        };
    }
}

export async function manageChildApproval(
    target: ChildApprovalTarget,
    operation: 'regularize' | 'resend' | 'revoke',
    consentId?: string,
    reason?: string,
): Promise<Result<ChildApprovalResult>> {
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
        return res.ok
            ? { ok: true, data: data as ChildApprovalResult }
            : { ok: false, error: nestErrorMessage(data) };
    } catch {
        return { ok: false, error: 'Não foi possível registrar a alteração.' };
    }
}
