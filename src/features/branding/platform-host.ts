const DEFAULT_PLATFORM_HOSTS = [
    "face2go.com.br",
    "www.face2go.com.br",
    "localhost",
    "127.0.0.1",
];

export function stripPort(host: string): string {
    return host.trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
}

export function platformHosts(): string[] {
    const extra = process.env.PLATFORM_HOSTS?.split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);
    return [...DEFAULT_PLATFORM_HOSTS, ...(extra ?? [])];
}

export function isPlatformHost(host: string): boolean {
    const normalized = host.trim().toLowerCase().replace(/\.$/, "");
    const noPort = stripPort(normalized);
    const list = new Set(platformHosts());
    if (list.has(normalized) || list.has(noPort)) return true;
    return noPort === "face2go.com.br" || noPort.endsWith(".face2go.com.br");
}

type HeaderSource = { get(name: string): string | null };

/** Host público da requisição. O Auth.js troca o nextUrl pelo AUTH_URL. */
export function requestPublicOrigin(request: {
    headers: HeaderSource;
    nextUrl: { host: string; protocol: string; origin: string };
}): string {
    const host = (
        request.headers.get("x-forwarded-host") ??
        request.headers.get("host") ??
        request.nextUrl.host
    )
        .split(",")[0]
        ?.trim();
    const protoRaw = (
        request.headers.get("x-forwarded-proto") ??
        request.nextUrl.protocol.replace(/:$/, "")
    )
        .split(",")[0]
        ?.trim();
    const proto = protoRaw === "http" || protoRaw === "https" ? protoRaw : "https";
    if (!host) return request.nextUrl.origin;
    return `${proto}://${host}`;
}

/**
 * Mantém login/logout no domínio que o visitante abriu.
 * Ainda aceita a origem do AUTH_URL (face2go.com.br).
 */
export function authRedirectTarget(
    url: string,
    origin: string,
    baseUrl: string,
): string {
    const root = origin.replace(/\/$/, "");
    const fallback = `${root}/login`;
    if (url.startsWith("/") && !url.startsWith("//")) {
        return `${root}${url}`;
    }
    try {
        const target = new URL(url);
        if (target.origin === root || target.origin === baseUrl) return url;
    } catch {
        return fallback;
    }
    return fallback;
}
