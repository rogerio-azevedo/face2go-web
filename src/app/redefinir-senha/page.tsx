import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { LoginHero } from "@/components/login/LoginHero";
import { BrandLogo } from "@/features/branding/components/BrandLogo";
import { getBrand } from "@/features/branding/server/get-brand";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
    const brand = await getBrand();
    return {
        title: `Redefinir senha • ${brand.appName}`,
        description: `Defina uma nova senha para sua conta ${brand.appName}`,
    };
}

type PageProps = {
    searchParams: Promise<{ token?: string }>;
};

export default async function RedefinirSenhaPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const token = params.token?.trim() ?? "";

    if (!token) {
        return (
            <div className="bg-auth-dot-grid relative flex min-h-full flex-1 flex-col px-4 py-8 sm:px-6 lg:min-h-screen lg:px-12 lg:py-12">
                <div className="mx-auto flex min-h-[min(820px,calc(100vh-7rem))] w-full max-w-6xl flex-1 flex-col items-stretch lg:flex-row lg:items-center lg:gap-14 xl:gap-20">
                    <aside className="hidden flex-1 py-6 lg:flex lg:max-w-lg lg:justify-end xl:max-w-xl">
                        <LoginHero />
                    </aside>
                    <div className="flex flex-1 items-center justify-center py-6 lg:justify-start lg:py-0">
                        <Card className="w-full max-w-md rounded-2xl border border-border/70 bg-brand-white shadow-lg shadow-black/7 ring-1 ring-black/4">
                            <CardHeader className="gap-4 space-y-0">
                                <BrandLogo />
                                <CardTitle className="text-2xl font-semibold tracking-tight text-brand-midnight-navy">
                                    Link inválido
                                </CardTitle>
                                <CardDescription className="text-base text-muted-foreground">
                                    Este link de redefinição de senha é inválido
                                    ou expirou. Solicite um novo link.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="flex flex-col gap-3 border-border/70 bg-muted/40">
                                <Link
                                    href="/recuperar-senha"
                                    className={buttonVariants({
                                        size: "lg",
                                        className: "h-11 w-full",
                                    })}
                                >
                                    Solicitar novo link
                                </Link>
                                <Link
                                    href="/login"
                                    className={buttonVariants({
                                        variant: "ghost",
                                        size: "lg",
                                        className: "h-11 w-full",
                                    })}
                                >
                                    Voltar ao login
                                </Link>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-auth-dot-grid relative flex min-h-full flex-1 flex-col px-4 py-8 sm:px-6 lg:min-h-screen lg:px-12 lg:py-12">
            <div className="mx-auto flex min-h-[min(820px,calc(100vh-7rem))] w-full max-w-6xl flex-1 flex-col items-stretch lg:flex-row lg:items-center lg:gap-14 xl:gap-20">
                <aside className="hidden flex-1 py-6 lg:flex lg:max-w-lg lg:justify-end xl:max-w-xl">
                    <LoginHero />
                </aside>
                <div className="flex flex-1 items-center justify-center py-6 lg:justify-start lg:py-0">
                    <ResetPasswordForm token={token} />
                </div>
            </div>
        </div>
    );
}
