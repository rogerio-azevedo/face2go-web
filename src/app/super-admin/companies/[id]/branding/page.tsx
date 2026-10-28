import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader";
import { CompanyBrandingForm } from "@/features/branding/admin/CompanyBrandingForm";
import { apiFetchAuthed, nestErrorMessage, parseResponseJson } from "@/lib/api-fetch";
import type { components } from "@/types/api.generated";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function CompanyBrandingPage({ params }: PageProps) {
    const { id } = await params;
    const res = await apiFetchAuthed(`/api/companies/${id}/branding`);
    const data = await parseResponseJson(res);
    if (res.status === 404) notFound();
    if (!res.ok) {
        throw new Error(nestErrorMessage(data));
    }

    const branding = data as components["schemas"]["CompanyBrandingResponseDto"];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Marca / White-label"
                description={branding.companyName}
            />
            <CompanyBrandingForm initial={branding} />
        </div>
    );
}
