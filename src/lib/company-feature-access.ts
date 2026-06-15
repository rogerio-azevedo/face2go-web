import type { FeatureSlug, PermissionAction } from './features';
import { getApiBaseUrl, parseResponseJson } from './api-fetch';

/** Avalia permissão granular chamando o backend Nest (`/api/me/can-check`). */
export async function evaluateCompanyFeatureAction(
    accessToken: string | undefined | null,
    featureSlug: FeatureSlug,
    action: PermissionAction,
): Promise<boolean> {
    if (!accessToken) return false;

    try {
        const base = getApiBaseUrl();
        const url = `${base}/api/me/can-check?feature=${encodeURIComponent(featureSlug)}&action=${encodeURIComponent(action)}`;

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: 'no-store',
        });

        if (!res.ok) return false;

        const data = (await parseResponseJson(res)) as { allowed?: boolean };
        return data.allowed === true;
    } catch {
        return false;
    }
}
