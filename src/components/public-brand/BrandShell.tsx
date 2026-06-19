import { LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicBrandConfig } from "@/lib/public-brands/types";

type BrandShellProps = {
    config: PublicBrandConfig;
};

export function BrandShellHeader({ config }: BrandShellProps) {
    const isCompactLogo = config.slug === "ienh";

    return (
        <header className="border-brand-header bg-brand-header supports-backdrop-filter:backdrop-blur-md sticky top-0 z-50 border-b px-4 py-3 shadow-sm sm:px-6">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
                <Link href={config.homeHref} className="shrink-0">
                    <Image
                        src={config.logo.src}
                        alt={config.logo.alt}
                        width={config.logo.width}
                        height={config.logo.height}
                        priority
                        className={cn(
                            isCompactLogo
                                ? "h-9 w-9 object-contain"
                                : "h-9 w-auto max-w-[176px]",
                            config.logo.headerClassName,
                        )}
                    />
                </Link>
                <Link
                    href="/login"
                    className={cn(
                        config.slug === "ienh"
                            ? "brand-cta-button inline-flex h-11 items-center gap-2 rounded-md px-5 text-[15px] font-semibold transition-colors"
                            : cn(
                                  buttonVariants({
                                      variant: "default",
                                      size: "lg",
                                  }),
                                  "h-11 gap-2 px-5 text-[15px] font-semibold",
                              ),
                    )}
                >
                    <LogIn aria-hidden className="size-4" />
                    Acessar o sistema
                </Link>
            </div>
        </header>
    );
}

export function BrandShellFooter({ config }: BrandShellProps) {
    const year = new Date().getFullYear();
    const ajudaHref = `${config.routePrefix}/ajuda`;

    return (
        <footer className="border-brand-footer bg-brand-footer border-t px-4 py-10 sm:px-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row sm:gap-8">
                <Link href={config.homeHref} className="shrink-0">
                    <Image
                        src={config.logo.src}
                        alt={config.logo.alt}
                        width={config.logo.width}
                        height={config.logo.height}
                        className={cn(
                            config.slug === "ienh"
                                ? "h-8 w-8 object-contain opacity-90"
                                : "h-8 w-auto max-w-[160px] opacity-90",
                            config.slug === "ienh"
                                ? "rounded-md bg-[#fff112] p-0.5"
                                : undefined,
                        )}
                    />
                </Link>
                <p className="max-w-md text-center text-sm leading-snug text-white/65 sm:text-right">
                    {config.copy.footerTagline} © {year}{" "}
                    {config.copy.copyrightName}. Todos os direitos reservados.
                </p>
                <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
                    <Link
                        href={ajudaHref}
                        className="text-white/75 underline-offset-4 hover:text-white hover:underline"
                    >
                        Ajuda
                    </Link>
                    <Link
                        href="/support"
                        className="text-white/75 underline-offset-4 hover:text-white hover:underline"
                    >
                        Suporte
                    </Link>
                    <Link
                        href="/privacy-policy"
                        className="text-white/75 underline-offset-4 hover:text-white hover:underline"
                    >
                        Política de Privacidade
                    </Link>
                    <Link
                        href="/terms-of-use"
                        className="text-white/75 underline-offset-4 hover:text-white hover:underline"
                    >
                        Termos de Uso
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
