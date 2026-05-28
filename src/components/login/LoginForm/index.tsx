"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ContextSelector } from "@/components/login/ContextSelector";
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
import {
    establishSessionFromContext,
    establishSessionFromLegacyLogin,
    isLegacyLoginResponse,
    loginWithEmail,
    selectContextWithToken,
} from "@/lib/auth-contexts";
import { getDashboardPathForRole } from "@/lib/dashboard-path";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import type { LoginResponse, UserContext } from "@/types/auth-context";

const marketingUrl = process.env.NEXT_PUBLIC_MARKETING_URL?.trim() ?? "";

type LoginStep = "credentials" | "context";

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");
    const registeredParam = searchParams.get("registered");
    const [step, setStep] = useState<LoginStep>("credentials");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginPayload, setLoginPayload] = useState<LoginResponse | null>(
        null,
    );

    useEffect(() => {
        if (registeredParam === "1") {
            toast.success("Cadastro realizado. Entre com sua conta.");
        }
    }, [registeredParam]);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const completeLogin = async (
        payload: LoginResponse,
        selectedContext: UserContext,
    ) => {
        const selected = await selectContextWithToken(
            payload.identityToken,
            selectedContext,
        );

        const result = await establishSessionFromContext({
            accessToken: selected.accessToken,
            user: selected.user,
            contexts: payload.contexts,
            activeContext: selected.context,
        });

        if (result?.error) {
            throw new Error("Não foi possível iniciar a sessão.");
        }

        toast.success("Login realizado.");
        router.push(getDashboardPathForRole(selected.user.role));
        router.refresh();
    };

    const onSubmit = handleSubmit(async (data) => {
        setIsSubmitting(true);
        try {
            const payload = await loginWithEmail(
                data.email,
                data.password,
            );

            if (isLegacyLoginResponse(payload)) {
                const result = await establishSessionFromLegacyLogin(payload);
                if (result?.error) {
                    throw new Error("Não foi possível iniciar a sessão.");
                }

                toast.success("Login realizado.");
                router.push(getDashboardPathForRole(payload.user.role));
                router.refresh();
                return;
            }

            if (payload.contexts.length === 1) {
                await completeLogin(payload, payload.contexts[0]!);
                return;
            }

            setLoginPayload(payload);
            setStep("context");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "E-mail ou senha inválidos.",
            );
        } finally {
            setIsSubmitting(false);
        }
    });

    const onSelectContext = async (context: UserContext) => {
        if (!loginPayload) return;
        setIsSubmitting(true);
        try {
            await completeLogin(loginPayload, context);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível selecionar o contexto.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (step === "context" && loginPayload) {
        return (
            <ContextSelector
                contexts={loginPayload.contexts}
                isSubmitting={isSubmitting}
                onSelect={onSelectContext}
            />
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
                        Entrar
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        Acesse sua conta para continuar no sistema.
                    </CardDescription>
                </div>
                {errorParam ? (
                    <p className="text-sm text-destructive" role="alert">
                        {errorParam}
                    </p>
                ) : null}
            </CardHeader>
            <form onSubmit={onSubmit}>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="username"
                            placeholder="voce@empresa.com.br"
                            aria-invalid={!!errors.email}
                            {...register("email")}
                        />
                        {errors.email ? (
                            <p className="text-xs text-destructive">
                                {errors.email.message}
                            </p>
                        ) : null}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Senha</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="current-password"
                                aria-invalid={!!errors.password}
                                className="pe-11"
                                {...register("password")}
                            />
                            <button
                                type="button"
                                aria-pressed={showPassword}
                                aria-label={
                                    showPassword
                                        ? "Ocultar senha"
                                        : "Mostrar senha"
                                }
                                className="text-muted-foreground hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute top-1/2 inset-e-2 z-10 -translate-y-1/2 rounded-md p-2 transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none"
                                disabled={isSubmitting}
                                onClick={() =>
                                    setShowPassword((previous) => !previous)
                                }
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" aria-hidden />
                                ) : (
                                    <Eye className="size-4" aria-hidden />
                                )}
                            </button>
                        </div>
                        {errors.password ? (
                            <p className="text-xs text-destructive">
                                {errors.password.message}
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
                        {isSubmitting ? "Entrando..." : "Entrar no sistema"}
                    </Button>
                    <nav className="flex flex-col gap-2 text-center sm:flex-row sm:justify-center sm:gap-6">
                        <Link
                            href="/register"
                            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                        >
                            Cadastro com convite
                        </Link>
                        <Link
                            href={marketingUrl || "/"}
                            className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                        >
                            {marketingUrl
                                ? "Voltar ao site"
                                : "Voltar ao início"}
                        </Link>
                    </nav>
                </CardFooter>
            </form>
        </Card>
    );
}
