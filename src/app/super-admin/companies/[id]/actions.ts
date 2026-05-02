'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import { generateInviteSchema } from '@/lib/validations/invites';

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return 'Dados inválidos.';
}

export async function generateInviteAction(
    formData: FormData,
): Promise<{ success: true; code: string } | { success: false; error: string }> {
    try {
        const companyId = formData.get('companyId')?.toString() ?? '';
        const role = formData.get('role')?.toString() ?? '';
        const parsed = generateInviteSchema.safeParse({
            companyId,
            role,
        });
        if (!parsed.success) {
            return { success: false, error: zodFirstMessage(parsed.error) };
        }

        const res = await apiFetchAuthed(
            `/api/companies/${parsed.data.companyId}/invite-links`,
            {
                method: 'POST',
                body: JSON.stringify({ role: parsed.data.role }),
            },
        );

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { success: false, error: nestErrorMessage(data) };
        }

        const json = (await res.json()) as { code: string };

        revalidatePath(`/super-admin/companies/${parsed.data.companyId}`);
        revalidatePath('/super-admin/companies');

        return { success: true, code: json.code };
    } catch {
        return { success: false, error: 'Sem permissão.' };
    }
}
