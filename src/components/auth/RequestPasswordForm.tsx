"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { requestPasswordReset } from "@/lib/auth-contexts";
import {
    requestPasswordSchema,
    type RequestPasswordInput,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RequestPasswordForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RequestPasswordInput>({
        resolver: zodResolver(requestPasswordSchema),
        defaultValues: { identifier: "" },
    });

    const onSubmit = handleSubmit(async (data) => {
        setIsSubmitting(true);
        try {
            await requestPasswordReset(data.identifier);
            setSubmitted(true);
            toast.success("Solicitação enviada.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível enviar a solicitação.",
            );
        } finally {
            setIsSubmitting(false);
        }
    });

    if (submitted) {
        return (
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
                        Verifique seu e-mail
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        Se encontramos uma conta com os dados informados, você
                        receberá um e-mail em instantes com o link para
                        redefinir sua senha.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="border-border/70 bg-muted/40">
                    <Button asChild className="h-11 w-full" size="lg">
                        <Link href="/login">Voltar ao login</Link>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md rounded-2xl border border-border/70 bg-brand-white shadow-lg shadow-black/7 ring-1 ring-black/4">
            <CardHeader className="gap-5 space-y-0">
                <Image
                    src="/face2go_dark.svg"
                    alt="Face2Go"
                    width={492}
                    height={185}
                    priority
                    className="h-10 w-auto max-w-[200px] shrink-0"
                />
                <div className="space-y-1.5 pt-2">
                    <CardTitle className="text-2xl font-semibold tracking-tight text-brand-midnight-navy">
                        Recuperar senha
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        Informe seu e-mail ou CPF. Enviaremos um link para
                        redefinir sua senha.
                    </CardDescription>
                </div>
            </CardHeader>
            <form onSubmit={onSubmit}>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="identifier">E-mail ou CPF</Label>
                        <Input
                            id="identifier"
                            type="text"
                            autoComplete="username"
                            placeholder="voce@empresa.com ou 000.000.000-00"
                            aria-invalid={!!errors.identifier}
                            {...register("identifier")}
                        />
                        {errors.identifier ? (
                            <p className="text-xs text-destructive">
                                {errors.identifier.message}
                            </p>
                        ) : null}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-border/70 bg-muted/40">
                    <Button
                        type="submit"
                        className="h-11 w-full text-[15px] font-semibold"
                        size="lg"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Enviando..." : "Enviar link"}
                    </Button>
                    <Link
                        href="/login"
                        className="text-center text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                    >
                        Voltar ao login
                    </Link>
                </CardFooter>
            </form>
        </Card>
    );
}
