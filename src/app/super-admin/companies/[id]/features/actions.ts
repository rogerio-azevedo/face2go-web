'use server';

import { revalidatePath } from 'next/cache';

import {
    apiFetchAuthed,
    nestErrorMessage,
    parseResponseJson,
} from '@/lib/api-fetch';
import type { PremiumFeatureSlug } from '@/lib/features';

export type CompanyFeatureRow = {
    slug: PremiumFeatureSlug;
    name: string;
    description: string;
    category: string;
    enabled: boolean;
    enabledAt: string | null;
    enabledBy: string | null;
};

export async function getCompanyFeaturesAction(
    companyId: string,
): Promise<{ features: CompanyFeatureRow[] } | { error: string }> {
    try {
        const res = await apiFetchAuthed(`/api/companies/${companyId}/features`);

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        const features = (await parseResponseJson(res)) as CompanyFeatureRow[];
        return { features };
    } catch {
        return { error: 'Não foi possível carregar os recursos da empresa.' };
    }
}

export async function toggleCompanyFeatureAction(
    companyId: string,
    slug: PremiumFeatureSlug,
    enabled: boolean,
): Promise<{ feature: CompanyFeatureRow } | { error: string }> {
    try {
        const res = await apiFetchAuthed(
            `/api/companies/${companyId}/features/${slug}`,
            {
                method: 'PATCH',
                body: JSON.stringify({ enabled }),
            },
        );

        if (!res.ok) {
            const data = await parseResponseJson(res);
            return { error: nestErrorMessage(data) };
        }

        const feature = (await parseResponseJson(res)) as CompanyFeatureRow;
        revalidatePath('/super-admin/companies');
        return { feature };
    } catch {
        return { error: 'Não foi possível atualizar o recurso.' };
    }
}
