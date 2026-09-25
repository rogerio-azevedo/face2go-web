'use server';

import { z } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';

export type TelegramChatRow = {
    id: string;
    chatId: string;
    chatType: 'private' | 'group' | 'supergroup';
    title: string | null;
    username: string | null;
    userId: string | null;
    userName: string | null;
    userEmail: string | null;
    isActive: boolean;
    createdAt: string;
};

export type TelegramLink = {
    url: string;
    expiresAt: string;
};

const linkTokenSchema = z
    .object({
        kind: z.enum(['user', 'group']),
        targetUserId: z.string().uuid().optional(),
    })
    .superRefine((value, ctx) => {
        if (value.kind === 'user' && !value.targetUserId) {
            ctx.addIssue({
                code: 'custom',
                message: 'Usuário obrigatório.',
                path: ['targetUserId'],
            });
        }
    });

export async function listTelegramAlertsAction(): Promise<
    { success: true; chats: TelegramChatRow[] } | { success: false; error: string }
> {
    try {
        const res = await apiFetchAuthed('/api/client/telegram-alerts');
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { success: false, error: nestErrorMessage(data) };
        }
        const chats = (data as { chats?: TelegramChatRow[] }).chats ?? [];
        return { success: true, chats };
    } catch {
        return { success: false, error: 'Sem permissão.' };
    }
}

export async function createTelegramLinkTokenAction(
    input: unknown,
): Promise<{ success: true; link: TelegramLink } | { success: false; error: string }> {
    const parsed = linkTokenSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: 'Dados inválidos.' };
    }

    try {
        const res = await apiFetchAuthed('/api/client/telegram-alerts/link-token', {
            method: 'POST',
            body: JSON.stringify(parsed.data),
        });
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { success: false, error: nestErrorMessage(data) };
        }
        const link = data as TelegramLink;
        return { success: true, link };
    } catch {
        return { success: false, error: 'Sem permissão.' };
    }
}

export async function setTelegramChatActiveAction(input: {
    id: string;
    isActive: boolean;
}): Promise<{ success: true } | { success: false; error: string }> {
    const parsed = z
        .object({ id: z.string().uuid(), isActive: z.boolean() })
        .safeParse(input);
    if (!parsed.success) {
        return { success: false, error: 'Dados inválidos.' };
    }

    try {
        const res = await apiFetchAuthed(
            `/api/client/telegram-alerts/${parsed.data.id}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ isActive: parsed.data.isActive }),
            },
        );
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { success: false, error: nestErrorMessage(data) };
        }
        return { success: true };
    } catch {
        return { success: false, error: 'Sem permissão.' };
    }
}

export async function deleteTelegramChatAction(
    id: string,
): Promise<{ success: true } | { success: false; error: string }> {
    if (!z.string().uuid().safeParse(id).success) {
        return { success: false, error: 'Dados inválidos.' };
    }

    try {
        const res = await apiFetchAuthed(`/api/client/telegram-alerts/${id}`, {
            method: 'DELETE',
        });
        const data = await parseResponseJson(res);
        if (!res.ok) {
            return { success: false, error: nestErrorMessage(data) };
        }
        return { success: true };
    } catch {
        return { success: false, error: 'Sem permissão.' };
    }
}
