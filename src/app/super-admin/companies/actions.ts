'use server';

import { revalidatePath } from 'next/cache';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import {
    createCompanySchema,
    updateCompanySchema,
    type CompanyFormPayload,
    type CompanyUpdatePayload,
} from '@/lib/validations/companies';
import { ZodError } from 'zod';

function zodFirstMessage(error: unknown): string {
    if (error instanceof ZodError && error.issues[0]?.message) {
        return error.issues[0].message;
    }
    return 'Dados inválidos.';
}

function revalidateCompaniesPages() {
    revalidatePath('/super-admin/companies');
    revalidatePath('/super-admin/dashboard');
}

export async function createCompanyAction(
    input: CompanyFormPayload,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsed = createCompanySchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const res = await apiFetchAuthed('/api/companies', {
            method: 'POST',
            body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidateCompaniesPages();
        return { success: true };
    } catch {
        return { error: 'Não foi possível criar a empresa.' };
    }
}

export async function updateCompanyAction(
    companyId: string,
    input: CompanyUpdatePayload,
): Promise<{ success: true } | { error: string }> {
    try {
        const parsed = updateCompanySchema.safeParse(input);
        if (!parsed.success) {
            return { error: zodFirstMessage(parsed.error) };
        }

        const res = await apiFetchAuthed(`/api/companies/${companyId}`, {
            method: 'PATCH',
            body: JSON.stringify(parsed.data),
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidateCompaniesPages();
        return { success: true };
    } catch {
        return { error: 'Não foi possível atualizar a empresa.' };
    }
}

export async function softDeleteCompanyAction(
    companyId: string,
): Promise<{ success: true } | { error: string }> {
    try {
        const res = await apiFetchAuthed(`/api/companies/${companyId}`, {
            method: 'DELETE',
        });

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        revalidateCompaniesPages();
        return { success: true };
    } catch {
        return { error: 'Sem permissão.' };
    }
}
