import Link from "next/link";

import {
    BrandShellFooter,
    BrandShellHeader,
} from "@/components/public-brand/BrandShell";
import { BrandThemeProvider } from "@/components/public-brand/BrandThemeProvider";
import { FacialExamplesSection } from "@/features/facial-guidelines/FacialExamplesSection";
import { FacialTipsSection } from "@/features/facial-guidelines/FacialTipsSection";
import type { PublicBrandConfig } from "@/lib/public-brands/types";

const NAV_LINKS = [
    { href: "#exemplos-ideais", label: "Exemplos ideais" },
    { href: "#exemplos-inadequados", label: "Exemplos inadequados" },
    { href: "#boas-praticas", label: "Boas práticas" },
    { href: "#dicas-importantes", label: "Dicas importantes" },
] as const;

type FacialGuidelinesPageProps = {
    config: PublicBrandConfig;
};

export function FacialGuidelinesPage({ config }: FacialGuidelinesPageProps) {
    const { facialGuidelines } = config;

    return (
        <BrandThemeProvider config={config}>
            <BrandShellHeader config={config} />
            <main
                id="main-content"
                className="bg-brand-off-white flex-1 px-4 py-10 sm:px-6 sm:py-14"
            >
                <div className="mx-auto w-full max-w-5xl">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-brand-slate mb-1 text-sm font-semibold tracking-wide uppercase">
                                {facialGuidelines.subtitle}
                            </p>
                            <h1 className="text-brand-deep-navy text-3xl font-bold tracking-tight sm:text-4xl">
                                {facialGuidelines.title}
                            </h1>
                            <p className="text-brand-slate mt-2 max-w-2xl text-base leading-7">
                                {facialGuidelines.intro}
                            </p>
                        </div>
                        <Link
                            href={`${config.routePrefix}/ajuda`}
                            className="text-brand-link shrink-0 text-sm font-medium hover:underline"
                        >
                            Ver manual do app
                        </Link>
                    </div>

                    <nav
                        aria-label="Seções das orientações"
                        className="mb-10 flex flex-wrap gap-2"
                    >
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="brand-nav-pill rounded-full border bg-white px-4 py-2 text-sm font-medium transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="space-y-14">
                        <FacialExamplesSection
                            heading={facialGuidelines.idealHeading}
                            kind="ideal"
                            examples={facialGuidelines.idealExamples}
                        />
                        <FacialExamplesSection
                            heading={facialGuidelines.inadequateHeading}
                            kind="inadequate"
                            examples={facialGuidelines.inadequateExamples}
                        />
                        <FacialTipsSection
                            practicesHeading={facialGuidelines.practicesHeading}
                            tipsHeading={facialGuidelines.tipsHeading}
                            practices={facialGuidelines.practices}
                            tips={facialGuidelines.tips}
                        />
                    </div>

                    <p className="text-brand-slate mt-12 rounded-xl border border-slate-200 bg-white px-5 py-4 text-center text-sm leading-6">
                        {facialGuidelines.footerNote}
                    </p>

                    <p className="text-brand-slate mt-6 text-center text-sm">
                        Ainda com dúvidas?{" "}
                        <Link
                            href={config.support.href}
                            className="text-brand-link font-medium hover:underline"
                        >
                            {config.support.label}
                        </Link>
                    </p>
                </div>
            </main>
            <BrandShellFooter config={config} />
        </BrandThemeProvider>
    );
}
