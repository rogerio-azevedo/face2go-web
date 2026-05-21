import { LogIn } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CTASection() {
    return (
        <section
            aria-labelledby="landing-cta-title"
            className="relative overflow-hidden bg-linear-to-br from-brand-deep-navy via-brand-midnight-navy to-brand-deep-navy px-4 py-16 sm:px-6 sm:py-20"
        >
            <div className="pointer-events-none absolute -top-24 right-[-10%] size-[min(480px,80vw)] rounded-full bg-brand-turquoise/15 blur-3xl" />
            <div className="relative mx-auto max-w-3xl text-center">
                <h2
                    id="landing-cta-title"
                    className="font-heading text-brand-white mb-4 text-balance text-2xl font-bold tracking-tight sm:text-3xl"
                >
                    Pronto para modernizar seu acesso?
                </h2>
                <p className="mx-auto mb-8 max-w-xl text-lg text-white/85 text-pretty">
                    Entre na plataforma para cadastrar pessoas, integrar equipamentos
                    e administrar suas unidades com o Face2Go.
                </p>
                <Link
                    href="/login"
                    className={cn(
                        buttonVariants({
                            variant: "default",
                            size: "lg",
                        }),
                        "h-12 min-w-[220px] justify-center px-10 text-[15px] font-semibold",
                    )}
                >
                    <LogIn aria-hidden className="size-4" />
                    Acessar o sistema
                </Link>
            </div>
        </section>
    );
}
