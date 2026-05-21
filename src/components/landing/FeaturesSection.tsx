import {
    CarFront,
    Fingerprint,
    PanelsTopBottom,
    Video,
} from "lucide-react";

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const features = [
    {
        title: "Leitores faciais",
        description:
            "Integração com os principais leitores faciais do mercado para cadastro biométrico e controle de acesso.",
        Icon: Fingerprint,
    },
    {
        title: "Sistemas de CFTV",
        description:
            "Conecte-se a infraestrutura de circuito fechado de TV para reforçar segurança e visibilidade.",
        Icon: Video,
    },
    {
        title: "Câmeras LPR",
        description:
            "Leitura de placas veiculares (LPR) integrada ao fluxo de cadastro e liberações.",
        Icon: CarFront,
    },
    {
        title: "Catracas",
        description:
            "Gestão de acesso físico alinhada a políticas por unidade, turno ou perfil.",
        Icon: PanelsTopBottom,
    },
] as const;

export function FeaturesSection() {
    return (
        <section
            id="integracoes"
            aria-labelledby="landing-features-title"
            className="scroll-mt-24 bg-brand-off-white px-4 py-16 sm:px-6 sm:py-24"
        >
            <div className="mx-auto max-w-6xl">
                <header className="mx-auto mb-12 max-w-3xl text-center">
                    <h2
                        id="landing-features-title"
                        className="font-heading text-brand-midnight-navy mb-3 text-2xl font-bold tracking-tight sm:text-3xl"
                    >
                        Integrações que unificam sua operação
                    </h2>
                    <p className="text-muted-foreground text-lg text-pretty">
                        Combine cadastro biométrico com os equipamentos que você
                        já usa ou pretende implantar — sem ficar preso a um
                        único fabricante.
                    </p>
                </header>
                <ul className="grid gap-5 sm:grid-cols-2 lg:gap-6">
                    {features.map(({ title, description, Icon }) => (
                        <li key={title}>
                            <Card className="h-full rounded-2xl border-border/70 bg-brand-white shadow-sm ring-1 ring-black/5">
                                <CardHeader className="gap-4 pb-6">
                                    <div className="bg-accent flex size-12 items-center justify-center rounded-xl text-brand-turquoise shadow-inner">
                                        <Icon
                                            className="size-6"
                                            aria-hidden
                                        />
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
