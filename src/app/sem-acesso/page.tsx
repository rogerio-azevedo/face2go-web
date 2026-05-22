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

export const metadata: Metadata = {
    title: "Sem permissão • Face2go",
    description:
        "Sua conta não tem permissão de acesso a esta área da plataforma.",
};

export default async function SemAcessoPage() {
    const session = await auth();
    const user = session?.user;

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <CardTitle>Sua conta não pode acessar esta plataforma</CardTitle>
                    <CardDescription>
                        Você está autenticado, mas o tipo de conta vinculada ao seu
                        e-mail não está habilitado no painel web. Entre em contato com o
                        suporte se precisar de acesso.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-muted-foreground text-sm">
                    {user?.email ? (
                        <p>
                            <span className="font-medium text-foreground">E-mail:</span>{" "}
                            {user.email}
                        </p>
                    ) : (
                        <p>Nenhuma sessão ativa encontrada neste navegador.</p>
                    )}
                    {user?.role != null ? (
                        <p>
                            <span className="font-medium text-foreground">Papel:</span>{" "}
                            {String(user.role)}
                        </p>
                    ) : user ? (
                        <p>
                            <span className="font-medium text-foreground">Papel:</span>{" "}
                            (não definido na sessão)
                        </p>
                    ) : null}
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
