import Image from "next/image";
import Link from "next/link";

import { ExternalLink, Smartphone } from "lucide-react";

const PLAY_STORE_URL =
    "https://play.google.com/store/apps/details?id=com.face2go";
const APP_STORE_URL =
    "https://apps.apple.com/br/app/face2go/id6769947369";

const STORE_LINKS = [
    {
        label: "Google Play (Android)",
        href: PLAY_STORE_URL,
        qrSrc: "/manual/qr/play-store.png",
    },
    {
        label: "App Store (iPhone)",
        href: APP_STORE_URL,
        qrSrc: "/manual/qr/app-store.png",
    },
] as const;

const STEPS = [
    {
        title: "Baixe o aplicativo",
        description:
            "Instale o Face2Go — Escola Segura na loja de aplicativos do seu celular. O app está disponível para Android e iPhone.",
        showStoreLinks: true,
    },
    {
        title: "Crie ou recupere sua senha",
        description:
            "Na tela de login, informe seu CPF e solicite a criação ou recuperação de senha. O sistema enviará um e-mail com as instruções para definir sua senha de acesso.",
    },
    {
        title: "Acesse o aplicativo",
        description:
            "Entre no app com seu CPF e a senha criada. Na primeira vez, você verá os alunos vinculados à sua conta e a escola correspondente.",
    },
    {
        title: "Grave a sua face",
        description:
            "No menu Cadastros, localize o card \"Eu\" e toque em \"Atualizar foto\". Siga as orientações na tela para capturar sua foto facial. Isso permite que você entre na escola pelos leitores faciais.",
    },
    {
        title: "Grave a face dos alunos",
        description:
            "Ainda em Cadastros, localize cada aluno vinculado e toque em \"Atualizar foto\" para registrar a face deles. Repita o processo para todos os filhos cadastrados na escola.",
    },
    {
        title: "Cadastre os veículos",
        description:
            "No menu Veículos, toque em \"Novo veículo\" e informe placa, modelo, cor e condutor. As placas são sincronizadas automaticamente com as câmeras LPR da escola.",
    },
    {
        title: "Acesse a escola",
        description:
            "Com a face cadastrada e sincronizada com os leitores, você já pode entrar na escola normalmente. Acompanhe os acessos pelo menu Acessos ou na tela inicial (Home).",
    },
] as const;

function AppStoreLinks() {
    return (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {STORE_LINKS.map((store) => (
                <div
                    key={store.href}
                    className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                    <Image
                        src={store.qrSrc}
                        alt={`QR Code para baixar o Face2Go na ${store.label}`}
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
                        className="text-brand-turquoise mt-2 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
                    >
                        {store.label}
                        <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                </div>
            ))}
        </div>
    );
}

export function ManualGettingStarted() {
    return (
        <section id="primeiros-passos" className="scroll-mt-24">
            <div className="mb-6 flex items-center gap-3">
                <div className="bg-brand-turquoise/10 text-brand-turquoise flex size-10 items-center justify-center rounded-full">
                    <Smartphone className="size-5" aria-hidden />
                </div>
                <div>
                    <h2 className="text-brand-deep-navy text-2xl font-bold tracking-tight">
                        Primeiros passos
                    </h2>
                    <p className="text-brand-slate text-sm">
                        Siga esta sequência para começar a usar o Face2Go
                    </p>
                </div>
            </div>

            <ol className="space-y-4">
                {STEPS.map((step, index) => (
                    <li
                        key={step.title}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                        <div className="flex gap-4">
                            <span
                                className="bg-brand-turquoise text-brand-deep-navy flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
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
                                {"showStoreLinks" in step &&
                                step.showStoreLinks ? (
                                    <AppStoreLinks />
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
                    className="text-brand-turquoise font-medium hover:underline"
                >
                    recuperar senha
                </Link>{" "}
                no site ou use a opção correspondente na tela de login do app.
            </p>
        </section>
    );
}
