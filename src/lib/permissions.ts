import { auth } from '@/auth';

import type { FeatureSlug, PermissionAction } from './features';

export async function can(
    featureSlug: FeatureSlug,
    action: PermissionAction,
): Promise<boolean> {
    const session = await auth();
    const token = session?.accessToken;

    if (!session?.user?.companyId || !token) return false;

    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    if (!base) return false;

    try {
        const url = new URL(`${base}/api/me/can-check`);
        url.searchParams.set('feature', featureSlug);
        url.searchParams.set('action', action);

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });

        if (!res.ok) return false;

        const data = (await res.json()) as { allowed?: boolean };
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
    const user = session?.user;

    if (!user) {
        return { mainPaths: null };
    }

    if (user.role === 'super_admin') {
        return { mainPaths: null };
    }

    if (!user.companyId || !token) {
        return { mainPaths: ['/company/dashboard'] };
    }

    if (user.role !== 'company_admin' && user.role !== 'company_operator') {
        return { mainPaths: null };
    }

    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    if (!base) {
        return { mainPaths: ['/company/dashboard'] };
    }

    try {
        const res = await fetch(`${base}/api/me/navigation`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });

        if (!res.ok) {
            return { mainPaths: ['/company/dashboard'] };
        }

        return (await res.json()) as { mainPaths: string[] | null };
    } catch {
        return { mainPaths: ['/company/dashboard'] };
    }
}
