'use server';

import { ZodError } from 'zod';

import {
    apiFetchPublic,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import { registerSchema } from '@/lib/validations/register';

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return 'Dados inválidos.';
}

export type InvitePreview =
    | {
          inviteType: 'company';
          role: 'company_admin' | 'company_operator';
          companyName: string;
      }
    | {
          inviteType: 'client';
          role: 'client_admin' | 'client_operator';
          clientName: string;
          companyName: string;
      }
    | null;

const COMPANY_ROLES = ['company_admin', 'company_operator'] as const;
const CLIENT_ROLES = ['client_admin', 'client_operator'] as const;

function parseCompanyInvitePreview(data: unknown): InvitePreview {
    if (!data || typeof data !== 'object') return null;

    const record = data as Record<string, unknown>;
    const companyName =
        typeof record.companyName === 'string' ? record.companyName.trim() : '';
    const role = record.role;

    if (!companyName) return null;
    if (!COMPANY_ROLES.includes(role as (typeof COMPANY_ROLES)[number])) {
        return null;
    }

    return {
        inviteType: 'company',
        role: role as (typeof COMPANY_ROLES)[number],
        companyName,
    };
}

function parseClientInvitePreview(data: unknown): InvitePreview {
    if (!data || typeof data !== 'object') return null;

    const record = data as Record<string, unknown>;
    const clientName =
        typeof record.clientName === 'string' ? record.clientName.trim() : '';
    const companyName =
        typeof record.companyName === 'string' ? record.companyName.trim() : '';
    const role = record.role;

    if (!clientName || !companyName) return null;
    if (!CLIENT_ROLES.includes(role as (typeof CLIENT_ROLES)[number])) {
        return null;
    }

    return {
        inviteType: 'client',
        role: role as (typeof CLIENT_ROLES)[number],
        clientName,
        companyName,
    };
}

export async function getInvitePreviewAction(code: string): Promise<InvitePreview> {
    const trimmed = code?.trim() ?? '';
    if (trimmed.length < 4) return null;

    try {
        const companyRes = await apiFetchPublic(
            `/api/invite-links/${encodeURIComponent(trimmed)}`,
        );

        if (companyRes.ok) {
            const data = await companyRes.json();
            const companyPreview = parseCompanyInvitePreview(data);
            if (companyPreview) return companyPreview;
        }

        const clientRes = await apiFetchPublic(
            `/api/client-invite-links/${encodeURIComponent(trimmed)}`,
        );

        if (!clientRes.ok) return null;

        const data = await clientRes.json();
        return parseClientInvitePreview(data);
    } catch {
        return null;
    }
}

export async function registerWithInviteAction(
    input: unknown,
): Promise<{ success: true } | { success: false; error: string }> {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: zodFirstMessage(parsed.error) };
    }

    try {
        const res = await apiFetchPublic('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { success: false, error: nestErrorMessage(data) };
        }

        return { success: true };
    } catch {
        return {
            success: false,
            error: 'Não foi possível concluir o cadastro.',
        };
    }
}
