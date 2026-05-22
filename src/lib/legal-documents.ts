import {
    apiFetchPublic,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";

export type LegalDocument = {
    id: string;
    type: string;
    version: string;
    title: string;
    content: string;
    effectiveDate: string;
    isActive: boolean;
    createdAt: string;
};

export function formatLegalDocumentEffectiveDate(value: string): string {
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

export async function getActiveLegalDocument(
    type: string,
): Promise<LegalDocument | null> {
    const res = await apiFetchPublic(`/api/legal-documents/${type}/active`);

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        const data = await parseResponseJson(res);
        throw new Error(nestErrorMessage(data));
    }

    return (await res.json()) as LegalDocument;
}
