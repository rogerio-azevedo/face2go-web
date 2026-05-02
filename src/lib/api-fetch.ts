import { auth } from '@/auth';

/** URL base do NestJS (sem barra final). */
export function getApiBaseUrl(): string {
    const base = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!base) {
        throw new Error('NEXT_PUBLIC_API_URL não definido.');
    }
    return base.replace(/\/$/, '');
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
