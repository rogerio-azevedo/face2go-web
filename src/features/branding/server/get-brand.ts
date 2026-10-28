import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/auth";
import { apiFetchPublic } from "@/lib/api-fetch";
import type { UserContext } from "@/types/auth-context";

import { isPlatformHost, stripPort } from "../platform-host";
import {
    defaultBrand,
    FACE2GO_ACCENT,
    FACE2GO_PRIMARY,
    type PublicBrandDto,
    type ResolvedBrand,
} from "../types";

function fromPublic(data: PublicBrandDto): ResolvedBrand {
    return {
        source: "domain",
        isDefault: false,
        companyId: data.companyId,
        appName: data.appName || defaultBrand.appName,
        primaryColor: data.colors.primary || FACE2GO_PRIMARY,
        accentColor: data.colors.accent || data.colors.primary || FACE2GO_ACCENT,
        logoUrl: data.logoUrl || defaultBrand.logoUrl,
        logoDarkUrl: data.logoDarkUrl || data.logoUrl || defaultBrand.logoDarkUrl,
        iconUrl: data.iconUrl || defaultBrand.iconUrl,
    };
}

function sessionBranding(context: UserContext | null | undefined) {
    if (!context) return null;
    if (context.type === "company") return context.branding ?? null;
    if (
        context.type === "client" ||
        context.type === "responsible" ||
        context.type === "member"
    ) {
        const branding = context.branding;
        if (!branding.appName && !branding.accentColor) return null;
        return branding;
    }
    return null;
}

const SESSION_BRAND_PREFIXES = ["/super-admin", "/company", "/client", "/monitoring"];

function usesSessionBrand(pathname: string): boolean {
    return SESSION_BRAND_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
}

function fromSession(context: UserContext): ResolvedBrand | null {
    const branding = sessionBranding(context);
    if (!branding) return null;
    const companyId =
        context.type === "company" ||
        context.type === "client" ||
        context.type === "responsible" ||
        context.type === "member"
            ? context.companyId ?? null
            : null;
    return {
        source: "session",
        isDefault: false,
        companyId,
        appName: branding.appName?.trim() || defaultBrand.appName,
        primaryColor: branding.primaryColor || FACE2GO_PRIMARY,
        accentColor: branding.accentColor || branding.primaryColor || FACE2GO_ACCENT,
        logoUrl: branding.logoUrl || defaultBrand.logoUrl,
        logoDarkUrl: defaultBrand.logoDarkUrl,
        iconUrl: defaultBrand.iconUrl,
    };
}

export const getBrand = cache(async (): Promise<ResolvedBrand> => {
    const headerList = await headers();
    const raw =
        headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
    const host = raw.split(",")[0]?.trim().toLowerCase() ?? "";
    if (!host || isPlatformHost(host)) {
        const pathname = headerList.get("x-pathname") ?? "";
        if (!usesSessionBrand(pathname)) return defaultBrand;
        try {
            const session = await auth();
            const active = session?.user?.activeContext;
            return (active ? fromSession(active) : null) ?? defaultBrand;
        } catch {
            return defaultBrand;
        }
    }

    try {
        const res = await apiFetchPublic(
            `/api/public/branding/resolve?host=${encodeURIComponent(stripPort(host))}`,
            {
                next: { revalidate: 300, tags: [`branding:${stripPort(host)}`] },
            } as RequestInit,
        );
        if (!res.ok) return defaultBrand;
        return fromPublic((await res.json()) as PublicBrandDto);
    } catch {
        return defaultBrand;
    }
});
