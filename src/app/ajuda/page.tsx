import type { Metadata } from "next";
import Link from "next/link";

import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ManualFaq } from "@/components/ajuda/ManualFaq";
import { ManualGettingStarted } from "@/components/ajuda/ManualGettingStarted";
import { ManualScreens } from "@/components/ajuda/ManualScreens";

export const metadata: Metadata = {
    title: "Manual do App • Face2Go",
    description:
        "Manual de utilização do aplicativo Face2Go — Escola Segura para pais e responsáveis. Primeiros passos, guia das telas e perguntas frequentes.",
};

const NAV_LINKS = [
    { href: "#primeiros-passos", label: "Primeiros passos" },
    { href: "#telas-do-app", label: "Telas do app" },
    { href: "#faq", label: "FAQ" },
] as const;

export default function AjudaPage() {
    return (
        <>
            <LandingHeader />
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
                                Guia para pais e responsáveis usarem o Face2Go
                                — Escola Segura no celular: cadastro facial,
                                autorizações, acessos e veículos.
                            </p>
                        </div>
                        <Link
                            href="/"
                            className="text-brand-turquoise shrink-0 text-sm font-medium hover:underline"
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
                                className="border-brand-turquoise/30 text-brand-deep-navy hover:bg-brand-turquoise/10 rounded-full border bg-white px-4 py-2 text-sm font-medium transition-colors"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="space-y-14">
                        <ManualGettingStarted />
                        <ManualScreens />
                        <ManualFaq />
                    </div>

                    <p className="text-brand-slate mt-12 text-center text-sm">
                        Ainda com dúvidas?{" "}
                        <Link
                            href="/support"
                            className="text-brand-turquoise font-medium hover:underline"
                        >
                            Fale com o suporte
                        </Link>
                    </p>
                </div>
            </main>
            <LandingFooter />
        </>
    );
}
