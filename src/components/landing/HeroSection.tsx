import { LogIn } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroSection() {
    return (
        <section
            aria-labelledby="landing-hero-title"
            className="relative overflow-hidden bg-linear-to-br from-brand-deep-navy via-brand-deep-navy to-brand-midnight-navy px-4 py-16 sm:px-6 sm:py-24"
        >
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.2]"
                style={{
                    backgroundImage:
                        "radial-gradient(rgb(255 255 255 / 0.12) 1px, transparent 1px)",
                    backgroundSize: "22px 22px",
                }}
            />
            <div className="relative mx-auto max-w-6xl space-y-6 text-center lg:space-y-8 lg:text-left">
                <div className="inline-flex lg:justify-start">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-brand-midnight-navy/70 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-brand-off-white uppercase">
                        Cadastro • leitores • integrações
                    </span>
                </div>
                <h1
                    id="landing-hero-title"
                    className="font-heading mx-auto max-w-4xl text-balance text-3xl leading-tight font-bold tracking-tight text-brand-white sm:text-4xl lg:mx-0 lg:max-w-3xl lg:text-[2.5rem]"
                >
                    Gestão inteligente de acesso com{" "}
                    <span className="text-brand-turquoise">
                        Face2Go
                    </span>{" "}
                    e reconhecimento facial
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-pretty text-white/90 lg:mx-0 lg:max-w-2xl">
                    Sistema para gestão de cadastro integrado aos principais{" "}
                    <strong className="font-semibold text-white">
                        leitores faciais
                    </strong>
                    , câmeras, CFTV, LPR e catracas — tudo pensado para
                    operação clara no dia a dia.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                    <Link
                        href="/login"
                        className={cn(
                            buttonVariants({
                                variant: "default",
                                size: "lg",
                            }),
                            "h-12 min-w-[200px] justify-center px-8 text-[15px] font-semibold",
                        )}
                    >
                        <LogIn aria-hidden className="size-4" />
                        Acessar o sistema
                    </Link>
                    <a
                        href="#integracoes"
                        className={cn(
                            buttonVariants({
                                variant: "outline",
                                size: "lg",
                            }),
                            "h-12 border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white",
                        )}
                    >
                        Ver integrações
                    </a>
                </div>
            </div>
        </section>
    );
}
