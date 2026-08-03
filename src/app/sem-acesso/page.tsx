import type { Metadata } from "next";

import Link from "next/link";

import { auth } from "@/auth";

import { SignOutButton } from "@/components/shared/SignOutButton";
import { buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { SHARED_STORE_LINKS } from "@/lib/public-brands/shared";

export const metadata: Metadata = {
    title: "Sem permissão • Face2go",
    description:
        "Baixe o aplicativo Face2go para acessar sua conta de responsável.",
};

function getPageCopy(role: string | undefined) {
    if (role === "responsible") {
        return {
            title: "Use o aplicativo Face2go",
            description:
                "Contas de responsável acessam a plataforma pelo aplicativo móvel, não pelo painel web. Baixe o app no seu celular e entre com o mesmo e-mail.",
        };
    }

    return {
        title: "Sua conta não pode acessar esta plataforma",
        description:
            "Você está autenticado, mas este tipo de conta não está habilitado no painel web. Baixe o aplicativo Face2go no seu celular para acessar os recursos disponíveis.",
    };
}

export default async function SemAcessoPage() {
    const session = await auth();
    const user = session?.user;
    const copy = getPageCopy(user?.role);

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle>{copy.title}</CardTitle>
                    <CardDescription>{copy.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-muted-foreground text-sm">
                    {user?.email ? (
                        <p>
                            <span className="font-medium text-foreground">E-mail:</span>{" "}
                            {user.email}
                        </p>
                    ) : (
                        <p>Nenhuma sessão ativa encontrada neste navegador.</p>
                    )}

                    <div className="space-y-2">
                        <p className="font-medium text-foreground">
                            Baixe o aplicativo
                        </p>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <a
                                href={SHARED_STORE_LINKS.playStore}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonVariants({ variant: "default" })}
                            >
                                Google Play (Android)
                            </a>
                            <a
                                href={SHARED_STORE_LINKS.appStore}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonVariants({ variant: "outline" })}
                            >
                                App Store (iPhone)
                            </a>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    {user ? (
                        <SignOutButton />
                    ) : (
                        <Link
                            href="/login"
                            className={buttonVariants({ variant: "default" })}
                        >
                            Ir para entrar
                        </Link>
                    )}
                    <Link
                        href="/"
                        className={buttonVariants({ variant: "ghost" })}
                    >
                        Página inicial
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
