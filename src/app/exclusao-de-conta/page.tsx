import type { Metadata } from "next";
import Link from "next/link";

import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

const ACCOUNT_DELETION_EMAIL = "privacidade@face2go.com.br";
const ACCOUNT_DELETION_MAILTO = `mailto:${ACCOUNT_DELETION_EMAIL}?subject=${encodeURIComponent("Solicitação de exclusão de conta — Face2Go")}`;

export const metadata: Metadata = {
    title: "Exclusão de conta • Face2Go",
    description:
        "Solicite a exclusão da sua conta e dos dados associados no aplicativo Face2Go.",
};

export default function AccountDeletionPage() {
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
                            Aplicativo Face2Go · R. F. DE AZEVEDO SERVICOS
                            INTELIGENTES LTDA
                        </p>
                        <Link
                            href="/"
                            className="text-brand-turquoise text-sm font-medium hover:underline"
                        >
                            Voltar ao início
                        </Link>
                    </div>

                    <article className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
                        <h1 className="text-brand-midnight-navy mb-4 text-2xl font-bold sm:text-3xl">
                            Exclusão de conta — Face2Go
                        </h1>

                        <p className="text-brand-slate mb-6 leading-relaxed">
                            Se você utiliza o aplicativo <strong>Face2Go</strong>{" "}
                            e deseja excluir sua conta e os dados pessoais
                            associados, siga as instruções abaixo. Esta página
                            atende ao requisito de solicitação de exclusão fora
                            do aplicativo, conforme exigido pelo Google Play.
                        </p>

                        <section className="mb-8">
                            <h2 className="text-brand-midnight-navy mb-3 text-xl font-semibold">
                                Como solicitar a exclusão
                            </h2>
                            <ol className="text-brand-slate list-decimal space-y-2 pl-5 leading-relaxed">
                                <li>
                                    Envie um e-mail para{" "}
                                    <a
                                        href={ACCOUNT_DELETION_MAILTO}
                                        className="text-brand-turquoise font-medium hover:underline"
                                    >
                                        {ACCOUNT_DELETION_EMAIL}
                                    </a>{" "}
                                    com o assunto &quot;Solicitação de exclusão
                                    de conta — Face2Go&quot;.
                                </li>
                                <li>
                                    Informe o <strong>e-mail</strong> cadastrado
                                    na sua conta Face2Go (obrigatório para
                                    localizarmos seu cadastro).
                                </li>
                                <li>
                                    Opcionalmente, inclua seu nome completo e
                                    telefone para agilizar a identificação.
                                </li>
                                <li>
                                    Responderemos em até 15 dias úteis com a
                                    confirmação ou solicitação de informações
                                    adicionais, quando necessário.
                                </li>
                            </ol>
                            <p className="mt-4">
                                <a
                                    href={ACCOUNT_DELETION_MAILTO}
                                    className="bg-brand-turquoise hover:bg-brand-turquoise/90 inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white transition-colors"
                                >
                                    Solicitar exclusão por e-mail
                                </a>
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-brand-midnight-navy mb-3 text-xl font-semibold">
                                O que será excluído
                            </h2>
                            <p className="text-brand-slate mb-3 leading-relaxed">
                                Após a confirmação da solicitação, buscaremos
                                remover, quando aplicável:
                            </p>
                            <ul className="text-brand-slate list-disc space-y-1 pl-5 leading-relaxed">
                                <li>Dados cadastrais (nome, e-mail, telefone);</li>
                                <li>Foto facial e dados biométricos vinculados;</li>
                                <li>Permissões e vínculos com estabelecimentos;</li>
                                <li>Histórico de acessos e registros operacionais;</li>
                                <li>
                                    Dados sincronizados com leitores faciais
                                    vinculados ao seu cadastro.
                                </li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-brand-midnight-navy mb-3 text-xl font-semibold">
                                Dados que podem ser mantidos
                            </h2>
                            <p className="text-brand-slate leading-relaxed">
                                Algumas informações poderão ser mantidas
                                temporariamente quando necessário para cumprimento
                                de obrigação legal, segurança, auditoria,
                                prevenção de fraudes ou exercício regular de
                                direitos, conforme descrito na nossa{" "}
                                <Link
                                    href="/privacy-policy"
                                    className="text-brand-turquoise font-medium hover:underline"
                                >
                                    Política de Privacidade
                                </Link>
                                .
                            </p>
                        </section>

                        <section>
                            <h2 className="text-brand-midnight-navy mb-3 text-xl font-semibold">
                                Exclusão dentro do aplicativo
                            </h2>
                            <p className="text-brand-slate leading-relaxed">
                                No aplicativo Face2Go, acesse{" "}
                                <strong>Menu → Perfil</strong> e toque em{" "}
                                <strong>Excluir minha conta</strong> para abrir
                                esta página e iniciar a solicitação.
                            </p>
                        </section>
                    </article>

                    <p className="text-brand-slate mt-8 text-center text-sm">
                        Dúvidas sobre privacidade?{" "}
                        <a
                            href={ACCOUNT_DELETION_MAILTO}
                            className="text-brand-turquoise font-medium hover:underline"
                        >
                            {ACCOUNT_DELETION_EMAIL}
                        </a>
                    </p>
                </div>
            </main>
            <LandingFooter />
        </>
    );
}
