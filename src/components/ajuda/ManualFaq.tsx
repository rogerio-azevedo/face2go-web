"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { ChevronDown, HelpCircle } from "lucide-react";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

const FAQ_ITEMS = [
    {
        question: "Como baixo o aplicativo?",
        answer: (
            <>
                O Face2Go — Escola Segura está disponível na{" "}
                <a
                    href="https://play.google.com/store/apps/details?id=com.face2go"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-turquoise font-medium hover:underline"
                >
                    Google Play
                </a>{" "}
                (Android) e na{" "}
                <a
                    href="https://apps.apple.com/br/app/face2go/id6769947369"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-turquoise font-medium hover:underline"
                >
                    App Store
                </a>{" "}
                (iPhone). Busque por &quot;Face2Go&quot; ou use os links da
                seção Primeiros passos acima.
            </>
        ),
    },
    {
        question: "Esqueci minha senha, o que faço?",
        answer: (
            <>
                Na tela de login do app, use a opção de recuperar senha informando
                seu CPF. Você também pode acessar{" "}
                <Link
                    href="/recuperar-senha"
                    className="text-brand-turquoise font-medium hover:underline"
                >
                    recuperar senha
                </Link>{" "}
                no site. Um e-mail será enviado com instruções para definir uma
                nova senha.
            </>
        ),
    },
    {
        question: "Como cadastro minha foto facial?",
        answer: "Abra o menu Cadastros, localize o card \"Eu\" e toque em \"Atualizar foto\". Siga as orientações na tela para capturar sua face. Quando aparecer \"Sincronizado com os leitores\", sua foto já está ativa nos equipamentos da escola.",
    },
    {
        question: "Como cadastro a foto dos meus filhos?",
        answer: "No menu Cadastros, em \"Alunos vinculados\", selecione cada filho e toque em \"Atualizar foto\". Repita para todos os alunos vinculados à sua conta. A sincronização com os leitores pode levar alguns instantes após o cadastro.",
    },
    {
        question: "Tenho filhos em escolas diferentes — funciona?",
        answer: "Sim. Se você é responsável por alunos em mais de uma escola, a tela Home exibe um seletor de escolas no topo. Escolha a escola desejada para ver os acessos e cadastros correspondentes àquele vínculo.",
    },
    {
        question: "Como autorizo alguém temporariamente a buscar meu filho?",
        answer: "No menu Cadastros, toque em \"Novo autorizado\" e escolha a opção temporária. Informe o período de validade e cadastre a pessoa presencialmente ou envie um link remoto para ela concluir o cadastro facial no próprio celular.",
    },
    {
        question: "Como cadastro um veículo?",
        answer: "No menu Veículos, toque em \"Novo veículo\" e preencha placa, modelo, cor e condutor. Após salvar, a placa é enviada automaticamente para as câmeras LPR da escola. O status \"Placa sincronizada com as câmeras\" confirma que o cadastro foi concluído.",
    },
    {
        question: "O que é a sincronização com os leitores e câmeras?",
        answer: "Após cadastrar ou atualizar uma foto facial ou placa de veículo, o Face2Go envia os dados para os equipamentos da escola (leitores faciais e câmeras LPR). Quando a sincronização termina, você vê a confirmação no app. Sem essa etapa, o acesso facial ou a leitura da placa pode não funcionar.",
    },
    {
        question: "Onde vejo o histórico de entradas e saídas?",
        answer: "No menu Acessos você encontra o histórico completo. Use os filtros no topo para ver registros de todos ou de uma pessoa específica. Toque em um acesso para abrir a foto capturada pelo leitor naquele momento.",
    },
    {
        question: "Como entro em contato com o suporte?",
        answer: (
            <>
                Acesse a página de{" "}
                <Link
                    href="/support"
                    className="text-brand-turquoise font-medium hover:underline"
                >
                    Suporte
                </Link>{" "}
                para falar conosco por e-mail (suporte@face2go.com.br) ou
                WhatsApp ((65) 99911-2805).
            </>
        ),
    },
] as const;

function FaqItem({
    question,
    answer,
}: {
    question: string;
    answer: ReactNode;
}) {
    return (
        <Collapsible className="group/faq border-b border-slate-200 last:border-b-0">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 py-4 text-left">
                <span className="text-brand-deep-navy text-base font-medium">
                    {question}
                </span>
                <ChevronDown
                    className="text-brand-slate size-5 shrink-0 transition-transform duration-200 group-data-[open]/faq:rotate-180"
                    aria-hidden
                />
            </CollapsibleTrigger>
            <CollapsibleContent className="text-brand-slate overflow-hidden pb-4 text-sm leading-7">
                {answer}
            </CollapsibleContent>
        </Collapsible>
    );
}

export function ManualFaq() {
    return (
        <section id="faq" className="scroll-mt-24">
            <div className="mb-6 flex items-center gap-3">
                <div className="bg-brand-turquoise/10 text-brand-turquoise flex size-10 items-center justify-center rounded-full">
                    <HelpCircle className="size-5" aria-hidden />
                </div>
                <div>
                    <h2 className="text-brand-deep-navy text-2xl font-bold tracking-tight">
                        Perguntas frequentes
                    </h2>
                    <p className="text-brand-slate text-sm">
                        Respostas rápidas para as dúvidas mais comuns
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-5 shadow-sm sm:px-6">
                {FAQ_ITEMS.map((item) => (
                    <FaqItem
                        key={item.question}
                        question={item.question}
                        answer={item.answer}
                    />
                ))}
            </div>
        </section>
    );
}
