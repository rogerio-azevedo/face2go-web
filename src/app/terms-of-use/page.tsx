import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalDocumentPageContent } from "@/components/legal/LegalDocumentPageContent";
import { getActiveLegalDocument } from "@/lib/legal-documents";

export const metadata: Metadata = {
    title: "Termos de Uso • Face2Go",
    description:
        "Termos de Uso do Face2Go — regras de acesso e utilização da plataforma, aplicativo e serviços de controle de acesso.",
};

export const dynamic = "force-dynamic";

export default async function TermsOfUsePage() {
    const document = await getActiveLegalDocument("terms_of_use");

    if (!document) {
        notFound();
    }

    return (
        <LegalDocumentPageContent
            document={document}
            contactLabel="Dúvidas sobre os termos?"
            contactEmail="contato@face2go.com.br"
        />
    );
}
