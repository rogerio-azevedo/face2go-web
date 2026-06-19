import type { Metadata } from "next";

import { getApiBaseUrl } from "@/lib/api-fetch";

export type ResponsibleRegisterAppBrand = "ienh" | "face2go";

export type PublicLinkAppBrand = ResponsibleRegisterAppBrand;

type PublicLinkPreview = {
    appBrand?: PublicLinkAppBrand;
};

export type ResponsibleRegisterPreview = {
    clientName: string;
    appBrand: ResponsibleRegisterAppBrand;
    inviterName: string | null;
    studentLinks: Array<{
        studentName: string;
        relationshipType: string;
        isAuthorizedPickup: boolean;
    }>;
    status: string;
    faceApprovalStatus: string;
};

const BRAND_METADATA: Record<
    ResponsibleRegisterAppBrand,
    Pick<Metadata, "title" | "description" | "openGraph">
> = {
    ienh: {
        title: "IENH - Access",
        description: "Link de cadastro da plataforma IENH Access",
        openGraph: {
            title: "IENH - Access",
            description: "Link de cadastro da plataforma IENH Access",
            images: [{ url: "/og/ienh-invite.png", width: 1200, height: 630 }],
        },
    },
    face2go: {
        title: "Face2Go - Escola Segura",
        description: "Link de cadastro da plataforma Face2Go - Escola Segura",
        openGraph: {
            title: "Face2Go - Escola Segura",
            description: "Link de cadastro da plataforma Face2Go - Escola Segura",
            images: [{ url: "/og/face2go-invite.png", width: 1200, height: 630 }],
        },
    },
};

export function getAppBaseUrl(): string {
    const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (raw) {
        return raw.replace(/\/$/, "");
    }
    return "https://www.face2go.com.br";
}

async function fetchPublicLinkPreview<T extends PublicLinkPreview>(
    path: string,
    code: string,
): Promise<T | null> {
    const trimmed = code.trim();
    if (!trimmed) return null;

    try {
        const url = `${getApiBaseUrl()}/api/${path}/${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, { next: { revalidate: 60 } });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    }
}

export async function fetchResponsibleRegisterPreview(
    code: string,
): Promise<ResponsibleRegisterPreview | null> {
    return fetchPublicLinkPreview<ResponsibleRegisterPreview>(
        "responsible-register",
        code,
    );
}

export async function fetchInviteRegisterPreview(
    code: string,
): Promise<PublicLinkPreview | null> {
    return fetchPublicLinkPreview<PublicLinkPreview>("invite-register", code);
}

export async function fetchPickupRegisterPreview(
    code: string,
): Promise<PublicLinkPreview | null> {
    return fetchPublicLinkPreview<PublicLinkPreview>("pickup-register", code);
}

export function buildResponsibleRegisterMetadata(
    appBrand: ResponsibleRegisterAppBrand,
): Metadata {
    return BRAND_METADATA[appBrand];
}

export function buildPublicLinkMetadata(
    appBrand: PublicLinkAppBrand = "face2go",
): Metadata {
    return buildResponsibleRegisterMetadata(appBrand);
}
