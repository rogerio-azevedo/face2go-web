import Image from "next/image";

import {
    Car,
    Clock,
    Home,
    UserPlus,
} from "lucide-react";

type ScreenImage = {
    src: string;
    alt: string;
    caption?: string;
};

const SCREENS = [
    {
        id: "home",
        icon: Home,
        title: "Home",
        subtitle: "Tela inicial após o login",
        description:
            "Ao entrar no app, você vê uma saudação personalizada e os últimos acessos registrados pelos leitores da escola — seus e dos alunos vinculados.",
        images: [
            {
                src: "/manual/home.png",
                alt: "Tela Home do Face2Go com últimos acessos e seletor de escola",
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
        icon: UserPlus,
        title: "Cadastros",
        subtitle: "A tela mais importante do app",
        description:
            "É aqui que você gerencia fotos faciais, responsáveis e pessoas autorizadas a acessar ou retirar alunos na escola.",
        images: [
            {
                src: "/manual/cadastros-responsaveis.png",
                alt: "Tela Cadastros com perfil do responsável, cônjuge e alunos vinculados",
                caption: "Perfil, responsáveis e alunos vinculados",
            },
            {
                src: "/manual/cadastros-autorizados.png",
                alt: "Tela Cadastros com seções de autorizados e autorizações temporárias",
                caption: "Autorizados e autorizações temporárias",
            },
        ],
        tips: [
            "No card \"Eu\", atualize sua própria foto facial para liberar o acesso pelos leitores.",
            "Em \"Responsáveis\", gerencie a foto do cônjuge ou outro responsável legal (pai e mãe).",
            "Em \"Alunos vinculados\", atualize a foto de cada filho cadastrado.",
            "Toque em \"Novo autorizado\" para cadastrar avós, tios, padrinhos ou outras pessoas.",
            "O sistema pergunta se a autorização é permanente ou temporária.",
            "Você pode cadastrar a pessoa presencialmente (junto com ela) ou gerar um link remoto de cadastro.",
            "Autorizações temporárias permitem retirada de alunos em um período definido.",
            "Quando a foto estiver sincronizada, aparece a mensagem \"Sincronizado com os leitores\".",
        ],
    },
    {
        id: "acessos",
        icon: Clock,
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
        icon: Car,
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
            "Toque em \"Novo veículo\" para cadastrar placa, modelo, cor e condutor.",
            "As placas são sincronizadas automaticamente com as câmeras LPR da escola.",
            "Quando sincronizado, aparece \"Placa sincronizada com as câmeras\" no card do veículo.",
            "Use \"Editar\" ou \"Excluir\" no canto superior de cada card para manter a lista atualizada.",
        ],
    },
] as const;

function ScreenGallery({ images }: { images: readonly ScreenImage[] }) {
    return (
        <div
            className={
                images.length > 1
                    ? "mb-4 grid gap-4 sm:grid-cols-2"
                    : "mb-4"
            }
        >
            {images.map((image) => (
                <figure
                    key={image.src}
                    className={
                        images.length === 1
                            ? "mx-auto w-full max-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                            : "overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    }
                >
                    <div className="relative aspect-9/19 w-full">
                        <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            sizes="(max-width: 640px) 50vw, 220px"
                            className="object-cover object-top"
                        />
                    </div>
                    {image.caption ? (
                        <figcaption className="text-brand-slate border-t border-slate-200 px-3 py-2 text-center text-xs">
                            {image.caption}
                        </figcaption>
                    ) : null}
                </figure>
            ))}
        </div>
    );
}

export function ManualScreens() {
    return (
        <section id="telas-do-app" className="scroll-mt-24">
            <div className="mb-6">
                <h2 className="text-brand-deep-navy text-2xl font-bold tracking-tight">
                    Telas do aplicativo
                </h2>
                <p className="text-brand-slate mt-1 text-sm">
                    Conheça cada menu e suas principais funcionalidades
                </p>
            </div>

            <div className="space-y-6">
                {SCREENS.map((screen) => {
                    const Icon = screen.icon;

                    return (
                        <article
                            key={screen.id}
                            id={screen.id}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                        >
                            <div className="mb-4 flex items-start gap-4">
                                <div className="bg-brand-deep-navy/5 text-brand-deep-navy flex size-11 shrink-0 items-center justify-center rounded-xl">
                                    <Icon className="size-5" aria-hidden />
                                </div>
                                <div>
                                    <h3 className="text-brand-deep-navy text-xl font-semibold">
                                        {screen.title}
                                    </h3>
                                    <p className="text-brand-turquoise text-sm font-medium">
                                        {screen.subtitle}
                                    </p>
                                </div>
                            </div>

                            <p className="text-brand-slate mb-4 text-base leading-7">
                                {screen.description}
                            </p>

                            <ScreenGallery images={screen.images} />

                            <ul className="text-brand-slate space-y-2 border-t border-slate-100 pt-4">
                                {screen.tips.map((tip) => (
                                    <li
                                        key={tip}
                                        className="flex gap-2 text-sm leading-6"
                                    >
                                        <span
                                            className="text-brand-turquoise mt-1.5 size-1.5 shrink-0 rounded-full bg-current"
                                            aria-hidden
                                        />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
