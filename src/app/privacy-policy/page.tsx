import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LegalDocumentMarkdown } from "@/components/legal/LegalDocumentMarkdown";
import {
    apiFetchPublic,
    nestErrorMessage,
    parseResponseJson,
} from "@/lib/api-fetch";

type LegalDocument = {
    id: string;
    type: string;
    version: string;
    title: string;
    content: string;
    effectiveDate: string;
    isActive: boolean;
    createdAt: string;
};

export const metadata: Metadata = {
    title: "Política de Privacidade • Face2Go",
    description:
        "Política de Privacidade do Face2Go — como tratamos dados pessoais, biometria facial e informações de crianças e adolescentes.",
};

export const dynamic = "force-dynamic";

function formatEffectiveDate(value: string): string {
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

async function getActivePrivacyPolicy(): Promise<LegalDocument | null> {
    const res = await apiFetchPublic("/api/legal-documents/privacy_policy/active");

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        const data = await parseResponseJson(res);
        throw new Error(nestErrorMessage(data));
    }

    return (await res.json()) as LegalDocument;
}

export default async function PrivacyPolicyPage() {
    const document = await getActivePrivacyPolicy();

    if (!document) {
        notFound();
    }

    return (
        <>
            <LandingHeader />
            <main
                id="main-content"
                className="bg-brand-off-white flex-1 px-4 py-10 sm:px-6 sm:py-14"
            >
                <div className="mx-auto w-full max-w-3xl">
                    <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-brand-slate text-sm">
                            Versão {document.version} · Vigência desde{" "}
                            {formatEffectiveDate(document.effectiveDate)}
                        </p>
                        <Link
                            href="/"
                            className="text-brand-turquoise text-sm font-medium hover:underline"
                        >
                            Voltar ao início
                        </Link>
                    </div>

                    <article className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
                        <LegalDocumentMarkdown content={document.content} />
                    </article>

                    <p className="text-brand-slate mt-8 text-center text-sm">
                        Dúvidas sobre privacidade?{" "}
                        <a
                            href="mailto:privacidade@face2go.com.br"
                            className="text-brand-turquoise font-medium hover:underline"
                        >
                            privacidade@face2go.com.br
                        </a>
                    </p>
                </div>
            </main>
            <LandingFooter />
        </>
    );
}
