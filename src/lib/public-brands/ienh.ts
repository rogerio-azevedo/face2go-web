import type { PublicBrandConfig } from "@/lib/public-brands/types";
import {
    SHARED_STEPS_AFTER_DOWNLOAD,
    SHARED_STORE_LINKS,
    buildSharedScreens,
} from "@/lib/public-brands/shared";

const APP_NAME = "IENH Access";

export const ienhBrand: PublicBrandConfig = {
    slug: "ienh",
    appName: APP_NAME,
    storeAppName: "Face2Go",
    displayName: "IENH Access",
    routePrefix: "/ienh",
    homeHref: "/",
    logo: {
        src: "/brands/ienh-access/logo.png",
        alt: "IENH Access",
        width: 512,
        height: 512,
        headerClassName: "rounded-md bg-[#fff112] p-1",
    },
    colors: {
        deepNavy: "#101010",
        accent: "#fff112",
        accentForeground: "#101010",
        link: "#101010",
        offWhite: "#f7fafc",
        slate: "#616161",
    },
    storeLinks: { ...SHARED_STORE_LINKS },
    support: { href: "/support", label: "Fale com o suporte" },
    metadata: {
        title: "Manual do App • IENH Access",
        description:
            "Manual de utilização do IENH Access para pais e responsáveis. Primeiros passos, guia das telas e perguntas frequentes.",
        ogImage: "/og/ienh-invite.png",
    },
    copy: {
        intro:
            "Guia para pais e responsáveis usarem o IENH Access no celular: cadastro facial, autorizações, acessos e veículos.",
        gettingStartedSubtitle:
            "Siga esta sequência para começar a usar o IENH Access",
        syncAppName: APP_NAME,
        steps: [
            {
                title: "Baixe o aplicativo",
                description:
                    "Instale o Face2Go na loja de aplicativos do seu celular (Android ou iPhone). Após entrar com seu login da escola IENH, o app exibirá a identidade visual da instituição.",
                showStoreLinks: true,
            },
            ...SHARED_STEPS_AFTER_DOWNLOAD,
        ],
        screens: buildSharedScreens(APP_NAME),
        faq: [
            {
                question: "Como baixo o aplicativo?",
                answer: [
                    {
                        type: "text",
                        text: "O aplicativo Face2Go está disponível na ",
                    },
                    { type: "store", store: "play" },
                    { type: "text", text: " (Android) e na " },
                    { type: "store", store: "app" },
                    {
                        type: "text",
                        text: ' (iPhone). Busque por "Face2Go" ou use os links da seção Primeiros passos acima. Após o login na escola IENH, o app exibe a identidade visual do IENH Access.',
                    },
                ],
            },
            {
                question: "Esqueci minha senha, o que faço?",
                answer: [
                    {
                        type: "text",
                        text: "Na tela de login do app, use a opção de recuperar senha informando seu CPF. Você também pode acessar ",
                    },
                    {
                        type: "link",
                        href: "/recuperar-senha",
                        label: "recuperar senha",
                    },
                    {
                        type: "text",
                        text: " no site. Um e-mail será enviado com instruções para definir uma nova senha.",
                    },
                ],
            },
            {
                question: "Como cadastro minha foto facial?",
                answer: [
                    {
                        type: "text",
                        text: 'Abra o menu Cadastros, localize o card "Eu" e toque em "Atualizar foto". Siga as orientações na tela para capturar sua face. Quando aparecer "Sincronizado com os leitores", sua foto já está ativa nos equipamentos da escola.',
                    },
                ],
            },
            {
                question: "Como cadastro a foto dos meus filhos?",
                answer: [
                    {
                        type: "text",
                        text: 'No menu Cadastros, em "Alunos vinculados", selecione cada filho e toque em "Atualizar foto". Repita para todos os alunos vinculados à sua conta. A sincronização com os leitores pode levar alguns instantes após o cadastro.',
                    },
                ],
            },
            {
                question: "Tenho filhos em escolas diferentes — funciona?",
                answer: [
                    {
                        type: "text",
                        text: "Sim. Se você é responsável por alunos em mais de uma escola, a tela Home exibe um seletor de escolas no topo. Escolha a escola desejada para ver os acessos e cadastros correspondentes àquele vínculo.",
                    },
                ],
            },
            {
                question: "Como autorizo alguém temporariamente a buscar meu filho?",
                answer: [
                    {
                        type: "text",
                        text: 'No menu Cadastros, toque em "Novo autorizado" e escolha a opção temporária. Informe o período de validade e cadastre a pessoa presencialmente ou envie um link remoto para ela concluir o cadastro facial no próprio celular.',
                    },
                ],
            },
            {
                question: "Como cadastro um veículo?",
                answer: [
                    {
                        type: "text",
                        text: 'No menu Veículos, toque em "Novo veículo" e preencha placa, modelo, cor e condutor. Após salvar, a placa é enviada automaticamente para as câmeras LPR da escola. O status "Placa sincronizada com as câmeras" confirma que o cadastro foi concluído.',
                    },
                ],
            },
            {
                question: "O que é a sincronização com os leitores e câmeras?",
                answer: [
                    {
                        type: "text",
                        text: "Após cadastrar ou atualizar uma foto facial ou placa de veículo, o app envia os dados para os equipamentos da escola (leitores faciais e câmeras LPR). Quando a sincronização termina, você vê a confirmação no app. Sem essa etapa, o acesso facial ou a leitura da placa pode não funcionar.",
                    },
                ],
            },
            {
                question: "Onde vejo o histórico de entradas e saídas?",
                answer: [
                    {
                        type: "text",
                        text: "No menu Acessos você encontra o histórico completo. Use os filtros no topo para ver registros de todos ou de uma pessoa específica. Toque em um acesso para abrir a foto capturada pelo leitor naquele momento.",
                    },
                ],
            },
            {
                question: "Como entro em contato com o suporte?",
                answer: [
                    { type: "text", text: "Acesse a página de " },
                    { type: "link", href: "/support", label: "Suporte" },
                    {
                        type: "text",
                        text: " para falar conosco por e-mail (suporte@face2go.com.br) ou WhatsApp ((65) 99911-2805).",
                    },
                ],
            },
        ],
        footerTagline:
            "Gestão de cadastro e acesso com leitores faciais e outros equipamentos.",
        copyrightName: "IENH Access",
    },
};
