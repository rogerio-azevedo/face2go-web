import type { components } from "@/types/api.generated";

export type PublicBrandDto = components["schemas"]["PublicBrandDto"];
export type CompanyBrandingDto = components["schemas"]["CompanyBrandingResponseDto"];

export type ResolvedBrand = {
    source: "default" | "domain" | "session";
    isDefault: boolean;
    companyId: string | null;
    appName: string;
    primaryColor: string;
    accentColor: string;
    logoUrl: string;
    logoDarkUrl: string;
    iconUrl: string;
};

export const FACE2GO_PRIMARY = "#001b3d";
export const FACE2GO_ACCENT = "#00c7b7";

export const defaultBrand: ResolvedBrand = {
    source: "default",
    isDefault: true,
    companyId: null,
    appName: "Face2Go",
    primaryColor: FACE2GO_PRIMARY,
    accentColor: FACE2GO_ACCENT,
    logoUrl: "/face2go_dark.svg",
    logoDarkUrl: "/face2go_white.svg",
    iconUrl: "/icone.png",
};
