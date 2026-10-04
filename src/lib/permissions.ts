import { cache } from 'react';

import { auth } from '@/auth';

import { apiFetchAuthed, parseResponseJson } from '@/lib/api-fetch';
import type { FeatureSlug, PermissionAction, PremiumFeatureSlug } from './features';

export async function can(
    featureSlug: FeatureSlug,
    action: PermissionAction,
): Promise<boolean> {
    const session = await auth();
    const token = session?.accessToken;

    if (!session?.user?.companyId || !token) return false;

    try {
        const res = await apiFetchAuthed(
            `/api/me/can-check?feature=${encodeURIComponent(featureSlug)}&action=${encodeURIComponent(action)}`,
        );

        if (!res.ok) return false;

        const data = (await parseResponseJson(res)) as { allowed?: boolean };
        return data.allowed === true;
    } catch {
        return false;
    }
}

export async function getCompanyFeatureFlags(): Promise<
    Record<PremiumFeatureSlug, boolean>
> {
    const session = await auth();
    const token = session?.accessToken;

    if (!session?.user?.companyId || !token) {
        return { monitoring: false, presence: false };
    }

    try {
        const res = await apiFetchAuthed('/api/me/company-features');

        if (!res.ok) return { monitoring: false, presence: false };

        const data = (await parseResponseJson(res)) as Partial<
            Record<PremiumFeatureSlug, boolean>
        >;
        return {
            monitoring: data.monitoring === true,
            presence: data.presence === true,
        };
    } catch {
        return { monitoring: false, presence: false };
    }
}

export const getClientType = cache(async (): Promise<string | null> => {
    const session = await auth();
    const token = session?.accessToken;

    if (!session?.user?.clientId || !token) return null;

    try {
        const res = await apiFetchAuthed(
            '/api/client/registrations?page=1&pageSize=1',
        );

        if (!res.ok) return null;

        const data = (await parseResponseJson(res)) as { clientType?: unknown };
        return typeof data.clientType === 'string' ? data.clientType : null;
    } catch {
        return null;
    }
});

export async function getSidebarNavAccess(): Promise<{
    mainPaths: string[] | null;
}> {
    const session = await auth();
    const token = session?.accessToken;

    if (!session?.user?.companyId || !token) {
        return { mainPaths: null };
    }

    try {
        const res = await apiFetchAuthed('/api/me/sidebar-nav-access');

        if (!res.ok) return { mainPaths: null };

        const data = (await parseResponseJson(res)) as {
            mainPaths?: string[] | null;
        };
        return { mainPaths: data.mainPaths ?? null };
    } catch {
        return { mainPaths: null };
    }
}
