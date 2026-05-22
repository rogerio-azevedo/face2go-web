import Link from "next/link";

import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LegalDocumentMarkdown } from "@/components/legal/LegalDocumentMarkdown";
import {
    formatLegalDocumentEffectiveDate,
    type LegalDocument,
} from "@/lib/legal-documents";

type LegalDocumentPageContentProps = {
    document: LegalDocument;
    contactEmail: string;
    contactLabel: string;
};

export function LegalDocumentPageContent({
    document,
    contactEmail,
    contactLabel,
}: LegalDocumentPageContentProps) {
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
                            {formatLegalDocumentEffectiveDate(
                                document.effectiveDate,
                            )}
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
                        {contactLabel}{" "}
                        <a
                            href={`mailto:${contactEmail}`}
                            className="text-brand-turquoise font-medium hover:underline"
                        >
                            {contactEmail}
                        </a>
                    </p>
                </div>
            </main>
            <LandingFooter />
        </>
    );
}
