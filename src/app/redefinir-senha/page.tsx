import type { Metadata } from "next";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { LoginHero } from "@/components/login/LoginHero";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Redefinir senha • Face2go",
    description: "Defina uma nova senha para sua conta Face2go",
};

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
                                <Image
                                    src="/face2go_dark.svg"
                                    alt="Face2Go"
                                    width={492}
                                    height={185}
                                    priority
                                    className="h-10 w-auto max-w-[200px] shrink-0"
                                />
                                <CardTitle className="text-2xl font-semibold tracking-tight text-brand-midnight-navy">
                                    Link inválido
                                </CardTitle>
                                <CardDescription className="text-base text-muted-foreground">
                                    Este link de redefinição de senha é inválido
                                    ou expirou. Solicite um novo link.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="flex flex-col gap-3 border-border/70 bg-muted/40">
                                <Button asChild className="h-11 w-full" size="lg">
                                    <Link href="/recuperar-senha">
                                        Solicitar novo link
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="ghost"
                                    className="h-11 w-full"
                                    size="lg"
                                >
                                    <Link href="/login">Voltar ao login</Link>
                                </Button>
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
