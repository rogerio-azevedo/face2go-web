"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { apiFetchAuthed, nestErrorMessage, parseResponseJson } from "@/lib/api-fetch";
import type { components } from "@/types/api.generated";

import { companyBrandingFormSchema, toBrandingPayload } from "./schema";

type CompanyBranding = components["schemas"]["CompanyBrandingResponseDto"];
type BrandAssetKind = "logo" | "logo-dark" | "icon";

function brandingPath(companyId: string) {
    return `/super-admin/companies/${companyId}/branding`;
}

function refresh(branding: CompanyBranding | null, companyId: string) {
    revalidatePath(brandingPath(companyId));
    revalidatePath("/super-admin/dashboard");
    revalidatePath("/super-admin/companies");
    const domain = branding?.customDomain;
    if (domain) revalidateTag(`branding:${domain}`, "max");
}

async function readBranding(res: Response, companyId: string) {
    const data = await parseResponseJson(res);
    if (!res.ok) return { ok: false as const, error: nestErrorMessage(data) };
    const branding = data as CompanyBranding;
    refresh(branding, companyId);
    return { ok: true as const, branding };
}

export async function saveCompanyBrandingAction(companyId: string, input: unknown) {
    const parsed = companyBrandingFormSchema.safeParse(input);
    if (!parsed.success) {
        return {
            ok: false as const,
            error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
        };
    }
    const res = await apiFetchAuthed(`/api/companies/${companyId}/branding`, {
        method: "PUT",
        body: JSON.stringify(toBrandingPayload(parsed.data)),
    });
    return readBranding(res, companyId);
}

export async function uploadBrandAssetAction(
    companyId: string,
    kind: BrandAssetKind,
    formData: FormData,
) {
    const res = await apiFetchAuthed(
        `/api/companies/${companyId}/branding/assets/${kind}`,
        { method: "POST", body: formData },
    );
    return readBranding(res, companyId);
}

export async function removeBrandAssetAction(companyId: string, kind: BrandAssetKind) {
    const res = await apiFetchAuthed(
        `/api/companies/${companyId}/branding/assets/${kind}`,
        { method: "DELETE" },
    );
    return readBranding(res, companyId);
}

export async function verifyDomainAction(companyId: string) {
    const res = await apiFetchAuthed(
        `/api/companies/${companyId}/branding/domain/verify`,
        { method: "POST" },
    );
    return readBranding(res, companyId);
}

export async function resetBrandingAction(companyId: string) {
    const res = await apiFetchAuthed(`/api/companies/${companyId}/branding`, {
        method: "DELETE",
    });
    return readBranding(res, companyId);
}
