import type { Metadata } from "next";

import { getApiBaseUrl } from "@/lib/api-fetch";

export type ResponsibleRegisterAppBrand = "ienh" | "face2go";

export type PublicLinkAppBrand = ResponsibleRegisterAppBrand;

type PublicLinkPreview = {
    appBrand?: PublicLinkAppBrand;
    clientType?: string;
};

export type ResponsibleRegisterPreview = {
    clientName: string;
    appBrand: ResponsibleRegisterAppBrand;
    clientType?: string;
    inviterName: string | null;
    studentLinks: Array<{
        studentName: string;
        relationshipType: string;
        isAuthorizedPickup: boolean;
    }>;
    status: string;
    faceApprovalStatus: string;
};

const GENERIC_OG_IMAGE = {
    url: "/og/face2go-generic.png",
    width: 1200,
    height: 630,
} as const;

const BRAND_METADATA: Record<
    ResponsibleRegisterAppBrand,
    Pick<Metadata, "title" | "description" | "openGraph" | "twitter">
> = {
    ienh: {
        title: "IENH - Access",
        description: "Link de cadastro da plataforma IENH Access",
        openGraph: {
            title: "IENH - Access",
            description: "Link de cadastro da plataforma IENH Access",
            images: [{ url: "/og/ienh-invite.png", width: 1200, height: 630 }],
        },
        twitter: {
            card: "summary_large_image",
            title: "IENH - Access",
            description: "Link de cadastro da plataforma IENH Access",
            images: ["/og/ienh-invite.png"],
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
        twitter: {
            card: "summary_large_image",
            title: "Face2Go - Escola Segura",
            description: "Link de cadastro da plataforma Face2Go - Escola Segura",
            images: ["/og/face2go-invite.png"],
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

export async function fetchRegisterPreview(
    code: string,
): Promise<PublicLinkPreview | null> {
    return fetchPublicLinkPreview<PublicLinkPreview>("register", code);
}

export function buildResponsibleRegisterMetadata(
    appBrand: ResponsibleRegisterAppBrand,
): Metadata {
    return BRAND_METADATA[appBrand];
}

export function buildPublicLinkMetadata(
    appBrand: PublicLinkAppBrand = "face2go",
    clientType?: string,
): Metadata {
    if (appBrand === "ienh") {
        return buildResponsibleRegisterMetadata("ienh");
    }
    if (clientType === "school") {
        return buildResponsibleRegisterMetadata("face2go");
    }
    return buildGenericPlatformMetadata(
        "Face2Go",
        "Link de cadastro da plataforma Face2Go",
    );
}

export function buildGenericPlatformMetadata(
    title: string,
    description: string,
): Metadata {
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: [GENERIC_OG_IMAGE],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [GENERIC_OG_IMAGE.url],
        },
    };
}
