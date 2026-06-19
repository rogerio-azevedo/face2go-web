import Link from "next/link";

import { ManualFaq } from "@/components/ajuda/ManualFaq";
import { ManualGettingStarted } from "@/components/ajuda/ManualGettingStarted";
import { ManualScreens } from "@/components/ajuda/ManualScreens";
import {
    BrandShellFooter,
    BrandShellHeader,
} from "@/components/public-brand/BrandShell";
import { BrandThemeProvider } from "@/components/public-brand/BrandThemeProvider";
import type { PublicBrandConfig } from "@/lib/public-brands/types";

const NAV_LINKS = [
    { href: "#primeiros-passos", label: "Primeiros passos" },
    { href: "#telas-do-app", label: "Telas do app" },
    { href: "#faq", label: "FAQ" },
] as const;

type ManualPageProps = {
    config: PublicBrandConfig;
};

export function ManualPage({ config }: ManualPageProps) {
    return (
        <BrandThemeProvider config={config}>
            <BrandShellHeader config={config} />
            <main
                id="main-content"
                className="bg-brand-off-white flex-1 px-4 py-10 sm:px-6 sm:py-14"
            >
                <div className="mx-auto w-full max-w-3xl">
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="text-brand-deep-navy text-3xl font-bold tracking-tight sm:text-4xl">
                                Manual do aplicativo
                            </h1>
                            <p className="text-brand-slate mt-2 max-w-2xl text-base leading-7">
                                {config.copy.intro}
                            </p>
                        </div>
                        <Link
                            href={config.homeHref}
                            className="text-brand-link shrink-0 text-sm font-medium hover:underline"
                        >
                            Voltar ao início
                        </Link>
                    </div>

                    <nav
                        aria-label="Seções do manual"
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
                        <ManualGettingStarted config={config} />
                        <ManualScreens config={config} />
                        <ManualFaq
                            faq={config.copy.faq}
                            storeLinks={config.storeLinks}
                        />
                    </div>

                    <p className="text-brand-slate mt-12 text-center text-sm">
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
