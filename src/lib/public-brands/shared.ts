import type { ManualScreen } from "@/lib/public-brands/types";

export const SHARED_STORE_LINKS = {
    playStore: "https://play.google.com/store/apps/details?id=com.face2go",
    appStore: "https://apps.apple.com/br/app/face2go/id6769947369",
    qrPlay: "/manual/qr/play-store.png",
    qrAppStore: "/manual/qr/app-store.png",
} as const;

export function buildSharedScreens(appName: string): ManualScreen[] {
    return [
        {
            id: "home",
            icon: "home",
            title: "Home",
            subtitle: "Tela inicial após o login",
            description:
                "Ao entrar no app, você vê uma saudação personalizada e os últimos acessos registrados pelos leitores da escola — seus e dos alunos vinculados.",
            images: [
                {
                    src: "/manual/home.png",
                    alt: `Tela Home do ${appName} com últimos acessos e seletor de escola`,
                },
            ],
            tips: [
                "Se você tiver alunos em mais de uma escola, use o seletor no topo para alternar entre elas.",
                "Cada card de acesso mostra o nome, o local do leitor e a data/hora do registro.",
                "Os acessos são agrupados por período (Hoje, Ontem, etc.) para facilitar a visualização.",
            ],
        },
        {
            id: "cadastros",
            icon: "user-plus",
            title: "Cadastros",
            subtitle: "A tela mais importante do app",
            description:
                "É aqui que você gerencia fotos faciais, responsáveis e pessoas autorizadas a acessar ou retirar alunos na escola.",
            images: [
                {
                    src: "/manual/cadastros-responsaveis.png",
                    alt: `Tela Cadastros com perfil do responsável, cônjuge e alunos vinculados`,
                    caption: "Perfil, responsáveis e alunos vinculados",
                },
                {
                    src: "/manual/cadastros-autorizados.png",
                    alt: "Tela Cadastros com seções de autorizados e autorizações temporárias",
                    caption: "Autorizados e autorizações temporárias",
                },
            ],
            tips: [
                'No card "Eu", atualize sua própria foto facial para liberar o acesso pelos leitores.',
                'Em "Responsáveis", gerencie a foto do cônjuge ou outro responsável legal (pai e mãe).',
                'Em "Alunos vinculados", atualize a foto de cada filho cadastrado.',
                'Toque em "Novo autorizado" para cadastrar avós, tios, padrinhos ou outras pessoas.',
                "O sistema pergunta se a autorização é permanente ou temporária.",
                "Você pode cadastrar a pessoa presencialmente (junto com ela) ou gerar um link remoto de cadastro.",
                "Autorizações temporárias permitem retirada de alunos em um período definido.",
                'Quando a foto estiver sincronizada, aparece a mensagem "Sincronizado com os leitores".',
            ],
        },
        {
            id: "acessos",
            icon: "clock",
            title: "Acessos",
            subtitle: "Histórico de entradas e saídas",
            description:
                "Consulte todos os registros capturados pelos leitores faciais da escola, com filtros por pessoa.",
            images: [
                {
                    src: "/manual/acessos-historico.png",
                    alt: "Tela Acessos com histórico e filtros por pessoa",
                    caption: "Histórico de acessos com filtros",
                },
                {
                    src: "/manual/acessos-foto.png",
                    alt: "Modal exibindo a foto capturada no momento do acesso",
                    caption: "Foto capturada pelo leitor ao tocar em um acesso",
                },
            ],
            tips: [
                "Use os filtros no topo para ver acessos de todos, apenas seus ou de um aluno específico.",
                "Cada registro mostra o leitor, a pessoa, a data/hora e o tipo (Entrada ou Saída).",
                "Toque em um acesso para visualizar a foto capturada naquele momento pelo leitor.",
                "O ícone de câmera indica que há foto disponível para aquele registro.",
            ],
        },
        {
            id: "veiculos",
            icon: "car",
            title: "Veículos",
            subtitle: "Gestão de veículos e placas",
            description:
                "Cadastre e gerencie os veículos utilizados para levar ou buscar alunos na escola.",
            images: [
                {
                    src: "/manual/veiculos.png",
                    alt: "Tela Veículos com lista de carros cadastrados e placas sincronizadas",
                },
            ],
            tips: [
                'Toque em "Novo veículo" para cadastrar placa, modelo, cor e condutor.',
                "As placas são sincronizadas automaticamente com as câmeras LPR da escola.",
                'Quando sincronizado, aparece "Placa sincronizada com as câmeras" no card do veículo.',
                'Use "Editar" ou "Excluir" no canto superior de cada card para manter a lista atualizada.',
            ],
        },
    ];
}

export const SHARED_STEPS_AFTER_DOWNLOAD = [
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
            'No menu Cadastros, localize o card "Eu" e toque em "Atualizar foto". Siga as orientações na tela para capturar sua foto facial. Isso permite que você entre na escola pelos leitores faciais.',
    },
    {
        title: "Grave a face dos alunos",
        description:
            'Ainda em Cadastros, localize cada aluno vinculado e toque em "Atualizar foto" para registrar a face deles. Repita o processo para todos os filhos cadastrados na escola.',
    },
    {
        title: "Cadastre os veículos",
        description:
            'No menu Veículos, toque em "Novo veículo" e informe placa, modelo, cor e condutor. As placas são sincronizadas automaticamente com as câmeras LPR da escola.',
    },
    {
        title: "Acesse a escola",
        description:
            "Com a face cadastrada e sincronizada com os leitores, você já pode entrar na escola normalmente. Acompanhe os acessos pelo menu Acessos ou na tela inicial (Home).",
    },
] as const;
