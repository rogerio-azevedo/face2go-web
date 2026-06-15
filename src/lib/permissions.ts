import { auth } from '@/auth';

import { apiFetchAuthed, parseResponseJson } from '@/lib/api-fetch';
import type { FeatureSlug, PermissionAction } from './features';

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
