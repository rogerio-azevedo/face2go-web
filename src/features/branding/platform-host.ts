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
