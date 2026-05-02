import { auth } from '@/auth';

/** Host é localhost ou IP de loopback. */
function isLoopbackHost(hostname: string): boolean {
    return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '[::1]'
    );
}

/** IPv4 privado (RFC1918) — uso comum em dev na LAN. */
function isPrivateLanIpv4(hostname: string): boolean {
    const m = /^(\d+)\.(\d+)\.\d+\.\d+$/.exec(hostname);
    if (!m) return false;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
}

/**
 * URL base do NestJS (sem barra final, sem path).
 * No browser: ajusta o host para o da página quando você abre pelo IP da rede
 * (ex.: celular em `http://192.168…:3000`) mas o env aponta para `localhost`
 * ou para **outro** IP privado do mesmo Mac — senão o fetch não chega no Nest.
 */
export function getApiBaseUrl(): string {
    const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!raw) {
        throw new Error('NEXT_PUBLIC_API_URL não definido.');
    }
    const normalized = raw.replace(/\/$/, '');
    try {
        const u = new URL(
            /^https?:\/\//i.test(normalized) ? normalized : `http://${normalized}`,
        );
        if (typeof window !== 'undefined') {
            const envHost = u.hostname;
            const pageHost = window.location.hostname;
            const pageIsRemote = !isLoopbackHost(pageHost);
            const pageOnLan = pageIsRemote && isPrivateLanIpv4(pageHost);
            const envIsLoopback = isLoopbackHost(envHost);
            const envOnLan = isPrivateLanIpv4(envHost);

            if (pageOnLan && (envIsLoopback || envOnLan)) {
                u.hostname = pageHost;
            }
        }
        return `${u.protocol}//${u.host}`;
    } catch {
        return normalized;
    }
}

export async function parseResponseJson(res: Response): Promise<unknown> {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

export function nestErrorMessage(data: unknown): string {
    if (data && typeof data === 'object' && 'message' in data) {
        const m = (data as { message: unknown }).message;
        if (typeof m === 'string') return m;
        if (Array.isArray(m)) return m.join(', ');
    }
    return 'Erro na API.';
}

export async function apiFetchAuthed(
    path: string,
    init?: RequestInit,
): Promise<Response> {
    const session = await auth();
    const token = session?.accessToken;
    if (!token) {
        throw new Error('Não autenticado.');
    }
    const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);
    const method = init?.method ?? 'GET';
    if (
        method !== 'GET' &&
        method !== 'HEAD' &&
        init?.body !== undefined &&
        !headers.has('Content-Type')
    ) {
        headers.set('Content-Type', 'application/json');
    }
    return fetch(url, { ...init, headers });
}

export async function apiFetchPublic(
    path: string,
    init?: RequestInit,
): Promise<Response> {
    const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(init?.headers);
    const method = init?.method ?? 'GET';
    if (
        method !== 'GET' &&
        method !== 'HEAD' &&
        init?.body !== undefined &&
        !headers.has('Content-Type')
    ) {
        headers.set('Content-Type', 'application/json');
    }
    return fetch(url, { ...init, headers });
}
