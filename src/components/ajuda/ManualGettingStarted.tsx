import Image from "next/image";
import Link from "next/link";

import { ExternalLink, Smartphone } from "lucide-react";

import type { PublicBrandConfig } from "@/lib/public-brands/types";

type ManualGettingStartedProps = {
    config: PublicBrandConfig;
};

function AppStoreLinks({ config }: ManualGettingStartedProps) {
    const stores = [
        {
            label: "Google Play (Android)",
            href: config.storeLinks.playStore,
            qrSrc: config.storeLinks.qrPlay,
        },
        {
            label: "App Store (iPhone)",
            href: config.storeLinks.appStore,
            qrSrc: config.storeLinks.qrAppStore,
        },
    ] as const;

    return (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {stores.map((store) => (
                <div
                    key={store.href}
                    className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                    <Image
                        src={store.qrSrc}
                        alt={`QR Code para baixar o ${config.storeAppName} na ${store.label}`}
                        width={140}
                        height={140}
                        className="rounded-lg bg-white p-2"
                    />
                    <p className="text-brand-slate mt-3 text-center text-xs">
                        Escaneie no celular ou toque no link abaixo
                    </p>
                    <a
                        href={store.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-link mt-2 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                    >
                        {store.label}
                        <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                </div>
            ))}
        </div>
    );
}

export function ManualGettingStarted({ config }: ManualGettingStartedProps) {
    return (
        <section id="primeiros-passos" className="scroll-mt-24">
            <div className="mb-6 flex items-center gap-3">
                <div className="brand-icon-badge flex size-10 items-center justify-center rounded-full">
                    <Smartphone className="size-5" aria-hidden />
                </div>
                <div>
                    <h2 className="text-brand-deep-navy text-2xl font-bold tracking-tight">
                        Primeiros passos
                    </h2>
                    <p className="text-brand-slate text-sm">
                        {config.copy.gettingStartedSubtitle}
                    </p>
                </div>
            </div>

            <ol className="space-y-4">
                {config.copy.steps.map((step, index) => (
                    <li
                        key={step.title}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                        <div className="flex gap-4">
                            <span
                                className="bg-brand-step-badge flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                                aria-hidden
                            >
                                {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-brand-deep-navy mb-2 text-lg font-semibold">
                                    {step.title}
                                </h3>
                                <p className="text-brand-slate text-base leading-7">
                                    {step.description}
                                </p>
                                {step.showStoreLinks ? (
                                    <AppStoreLinks config={config} />
                                ) : null}
                            </div>
                        </div>
                    </li>
                ))}
            </ol>

            <p className="text-brand-slate mt-6 text-sm">
                Precisa de ajuda com a senha? Acesse{" "}
                <Link
                    href="/recuperar-senha"
                    className="text-brand-link font-medium hover:underline"
                >
                    recuperar senha
                </Link>{" "}
                no site ou use a opção correspondente na tela de login do app.
            </p>
        </section>
    );
}
