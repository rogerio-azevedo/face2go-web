import { Building2, Fingerprint, LayoutDashboard, Shield } from "lucide-react";
import Link from "next/link";

const features = [
    {
        Icon: LayoutDashboard,
        text: "Operação empresa, cliente e dispositivos no mesmo lugar.",
    },
    {
        Icon: Fingerprint,
        text: "Cadastro biométrico integrado aos leitores faciais.",
    },
    {
        Icon: Building2,
        text: "Multi-unidade pensada para clínicas, escritórios e condomínios.",
    },
    {
        Icon: Shield,
        text: "Acesso por papéis e permissões, com segurança em primeiro plano.",
    },
] as const;

const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL ?? "";

export function LoginHero() {
    return (
        <div className="flex flex-col gap-8 lg:gap-10">
            {marketingUrl ? (
                <Link
                    href={marketingUrl}
                    className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-brand-slate underline-offset-4 transition-colors hover:text-brand-deep-navy hover:underline"
                >
                    <span aria-hidden>←</span>
                    Voltar para a landing
                </Link>
            ) : (
                <span className="h-6" aria-hidden />
            )}
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-deep-navy px-3 py-1.5 text-[11px] font-semibold tracking-wide text-brand-white uppercase shadow-sm select-none">
                    <Shield aria-hidden className="size-3.5 shrink-0" />
                    Acesso seguro
                </div>
                <h1 className="font-heading max-w-xl text-balance text-4xl leading-tight font-bold tracking-tight text-brand-midnight-navy lg:text-[2.375rem]">
                    Entre no{" "}
                    <span className="text-brand-turquoise">
                        Face2Go
                    </span>{" "}
                    e acompanhe suas unidades com mais clareza.
                </h1>
                <p className="max-w-md text-lg text-muted-foreground">
                    Plataforma multi-tenant para cadastro de faces e gestão dos
                    seus leitores — feita para operação diária, sem ruído
                    visual.
                </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {features.map(({ Icon, text }) => (
                    <div
                        key={text}
                        className="flex gap-3 rounded-2xl border border-border bg-brand-white px-4 py-3 shadow-sm shadow-black/4"
                    >
                        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-brand-deep-navy">
                            <Icon className="size-5" aria-hidden />
                        </div>
                        <p className="text-sm leading-snug text-brand-midnight-navy">
                            {text}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
