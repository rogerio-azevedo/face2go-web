import { Check } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step = {
    title: string;
    description: string;
    href?: string;
    actionLabel: string;
    done: boolean;
};

export function GettingStartedChecklist({
    readerOnline,
    hasRegistrationLink,
    hasApprovedRegistration,
    canManageReaders,
}: {
    readerOnline: boolean;
    hasRegistrationLink: boolean;
    hasApprovedRegistration: boolean;
    canManageReaders: boolean;
}) {
    const steps: Step[] = [
        {
            title: "Conectar um leitor",
            description: readerOnline
                ? "Há um leitor online nesta unidade."
                : "Sem leitor online, ninguém passa na porta.",
            href: canManageReaders ? "/client/leitores" : undefined,
            actionLabel: "Ver leitores",
            done: readerOnline,
        },
        {
            title: "Criar um link de cadastro",
            description: hasRegistrationLink
                ? "Já existe um link ativo para convidar pessoas."
                : "Envie o link ou o QR para as pessoas se cadastrarem.",
            href: "/client/cadastros?view=links",
            actionLabel: "Criar link",
            done: hasRegistrationLink,
        },
        {
            title: "Aprovar o primeiro cadastro",
            description: hasApprovedRegistration
                ? "Pelo menos um cadastro já foi aprovado."
                : "Quem se cadastrar aparece aqui para você liberar o acesso.",
            href: "/client/cadastros",
            actionLabel: "Abrir cadastros",
            done: hasApprovedRegistration,
        },
    ];

    if (steps.every((step) => step.done)) return null;

    return (
        <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
                Comece por aqui
            </h2>
            <ol className="space-y-3">
                {steps.map((step, index) => (
                    <li
                        key={step.title}
                        className="flex flex-col gap-3 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10 sm:flex-row sm:items-center"
                    >
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                            <span
                                className={cn(
                                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                                    step.done
                                        ? "bg-emerald-600 text-white"
                                        : "bg-muted text-foreground",
                                )}
                            >
                                {step.done ? (
                                    <Check className="size-4" aria-hidden />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <div className="min-w-0">
                                <p className="font-semibold">{step.title}</p>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                        {!step.done && step.href ? (
                            <Link
                                href={step.href}
                                className={cn(
                                    buttonVariants({ size: "lg" }),
                                    "h-11 shrink-0 px-4",
                                )}
                            >
                                {step.actionLabel}
                            </Link>
                        ) : null}
                    </li>
                ))}
            </ol>
        </section>
    );
}
