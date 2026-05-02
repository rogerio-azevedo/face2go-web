import type { FeatureSlug, PermissionAction } from './features';

/** Avalia permissão granular chamando o backend Nest (`/api/me/can-check`). */
export async function evaluateCompanyFeatureAction(
    accessToken: string | undefined | null,
    featureSlug: FeatureSlug,
    action: PermissionAction,
): Promise<boolean> {
    if (!accessToken) return false;

    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    if (!base) return false;

    try {
        const url = new URL(`${base}/api/me/can-check`);
        url.searchParams.set('feature', featureSlug);
        url.searchParams.set('action', action);

        const res = await fetch(url.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
        });

        if (!res.ok) return false;

        const data = (await res.json()) as { allowed?: boolean };
        return data.allowed === true;
    } catch {
        return false;
    }
}
