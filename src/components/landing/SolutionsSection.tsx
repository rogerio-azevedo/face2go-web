import {
    BriefcaseMedical,
    Building2,
    GraduationCap,
    Laptop,
} from "lucide-react";

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const solutions = [
    {
        title: "Escolas",
        description:
            "Controle de entrada de alunos, responsáveis e visitantes com rastreio e segurança no portão.",
        Icon: GraduationCap,
    },
    {
        title: "Clínicas",
        description:
            "Cadastro de pacientes e equipe com leitura facial nos pontos de acesso das unidades de saúde.",
        Icon: BriefcaseMedical,
    },
    {
        title: "Empresas",
        description:
            "Gestão corporativa de acesso, escalável para várias sedes e políticas por área.",
        Icon: Building2,
    },
    {
        title: "Escritórios",
        description:
            "Acesso seguro a coworkings e edifícios comerciais com auditoria simples.",
        Icon: Laptop,
    },
] as const;

export function SolutionsSection() {
    return (
        <section
            id="solucoes"
            aria-labelledby="landing-solutions-title"
            className="bg-background scroll-mt-24 px-4 py-16 sm:px-6 sm:py-24"
        >
            <div className="mx-auto max-w-6xl">
                <header className="mx-auto mb-12 max-w-3xl text-center">
                    <h2
                        id="landing-solutions-title"
                        className="font-heading text-brand-midnight-navy mb-3 text-2xl font-bold tracking-tight sm:text-3xl"
                    >
                        Soluções para o seu cenário
                    </h2>
                    <p className="text-muted-foreground text-lg text-pretty">
                        Do ambiente escolar ao corporativo, o mesmo núcleo de
                        cadastro e integração — adaptável às suas regras.
                    </p>
                </header>
                <ul className="grid gap-5 sm:grid-cols-2 lg:gap-6">
                    {solutions.map(({ title, description, Icon }) => (
                        <li key={title}>
                            <Card className="h-full rounded-2xl border-brand-deep-navy/10 bg-linear-to-br from-brand-off-white to-background shadow-sm ring-1 ring-brand-deep-navy/5">
                                <CardHeader className="gap-3">
                                    <div className="bg-brand-deep-navy flex size-11 items-center justify-center rounded-xl text-brand-white shadow-sm">
                                        <Icon className="size-6" aria-hidden />
                                    </div>
                                    <CardTitle className="text-brand-midnight-navy font-heading text-xl font-semibold">
                                        {title}
                                    </CardTitle>
                                    <CardDescription className="text-base leading-relaxed">
                                        {description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
