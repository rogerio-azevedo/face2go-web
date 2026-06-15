"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { joinContextAction } from "@/app/join/actions";
import { deferInEffect } from "@/lib/defer-in-effect";
import {
    getInvitePreviewAction,
    type InvitePreview,
} from "@/app/register/actions";
import { ContextSelector } from "@/components/login/ContextSelector";
import { Button, buttonVariants } from "@/components/ui/button";
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
    selectContextWithToken,
} from "@/lib/auth-contexts";
import { getDashboardPathForRole } from "@/lib/dashboard-path";
import {
    joinCredentialsSchema,
    type JoinCredentialsInput,
} from "@/lib/validations/auth";
import { cn } from "@/lib/utils";
import type { LoginResponse, UserContext } from "@/types/auth-context";

const companyRoleLabels: Record<string, string> = {
    company_admin: "Administrador da empresa",
    company_operator: "Operador",
};

const clientRoleLabels: Record<string, string> = {
    client_admin: "Administrador do cliente",
    client_operator: "Operador do cliente",
};

function inviteTitle(preview: InvitePreview): string {
    if (!preview) return "Entrar e vincular contexto";
    if (preview.inviteType === "company") {
        return `Entrar — ${preview.companyName || "—"}`;
    }
    return `Entrar — ${preview.clientName || "—"}`;
}

function inviteRoleLabel(preview: InvitePreview): string {
    if (!preview) return "";
    if (preview.inviteType === "company") {
        return companyRoleLabels[preview.role] ?? preview.role;
    }
    return clientRoleLabels[preview.role] ?? preview.role;
}

function inviteContextLabel(preview: InvitePreview): string {
    if (!preview) return "";
    if (preview.inviteType === "company") {
        return preview.companyName || "—";
    }
    const clientName = preview.clientName || "—";
    const companyName = preview.companyName || "—";
    return `${clientName} (${companyName})`;
}

type JoinStep = "credentials" | "context";

export function JoinContextForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteCode = searchParams.get("invite")?.trim() ?? "";

    const [inviteLoading, setInviteLoading] = useState(!!inviteCode);
    const [preview, setPreview] = useState<InvitePreview>(null);
    const [step, setStep] = useState<JoinStep>("credentials");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [joinPayload, setJoinPayload] = useState<LoginResponse | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<JoinCredentialsInput>({
        resolver: zodResolver(joinCredentialsSchema),
        defaultValues: { identifier: "", password: "" },
    });

    const loadInvite = useCallback(async () => {
        if (!inviteCode) {
            setInviteLoading(false);
            return;
        }
        setInviteLoading(true);
        try {
            const data = await getInvitePreviewAction(inviteCode);
            if (!data) {
                setPreview(null);
                toast.error("Convite inválido ou expirado.");
            } else {
                setPreview(data);
            }
        } finally {
            setInviteLoading(false);
        }
    }, [inviteCode]);

    useEffect(() => {
        deferInEffect(() => {
            void loadInvite();
        });
    }, [loadInvite]);

    const completeJoin = async (
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

        toast.success("Contexto vinculado com sucesso.");
        router.push(getDashboardPathForRole(selected.user.role));
        router.refresh();
    };

    const onSubmit = handleSubmit(async (data) => {
        setIsSubmitting(true);
        try {
            const result = await joinContextAction({
                identifier: data.identifier,
                password: data.password,
                invite: inviteCode,
            });

            if (!result.success) {
                toast.error(result.error);
                return;
            }

            const payload = result.data;

            if (payload.contexts.length === 1) {
                await completeJoin(payload, payload.contexts[0]!);
                return;
            }

            setJoinPayload(payload);
            setStep("context");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível vincular o contexto.",
            );
        } finally {
            setIsSubmitting(false);
        }
    });

    const onSelectContext = async (context: UserContext) => {
        if (!joinPayload) return;
        setIsSubmitting(true);
        try {
            await completeJoin(joinPayload, context);
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

    if (!inviteCode) {
        return (
            <Card className="w-full max-w-md shadow-md">
                <CardHeader>
                    <CardTitle>Vincular contexto</CardTitle>
                    <CardDescription>
                        É necessário um link válido com o parâmetro{" "}
                        <code className="text-xs">invite</code>.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Link
                        href="/login"
                        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                    >
                        Voltar ao login
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    if (inviteLoading) {
        return (
            <Card className="w-full max-w-md shadow-md">
                <CardContent className="pt-6">
                    <p className="text-muted-foreground text-sm">
                        Validando convite...
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (!preview) {
        return (
            <Card className="w-full max-w-md shadow-md">
                <CardHeader>
                    <CardTitle>Convite inválido</CardTitle>
                    <CardDescription>
                        Não foi possível usar este link. Solicite um novo convite
                        à administração.
                    </CardDescription>
                </CardHeader>
                <CardFooter>
                    <Link
                        href="/login"
                        className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                    >
                        Voltar ao login
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    if (step === "context" && joinPayload) {
        return (
            <ContextSelector
                contexts={joinPayload.contexts}
                isSubmitting={isSubmitting}
                onSelect={onSelectContext}
            />
        );
    }

    return (
        <Card className="w-full max-w-md shadow-md">
            <CardHeader>
                <CardTitle>{inviteTitle(preview)}</CardTitle>
                <CardDescription>
                    Contexto: <strong>{inviteContextLabel(preview)}</strong>
                    <br />
                    Papel: <strong>{inviteRoleLabel(preview)}</strong>
                    <br />
                    Entre com sua conta existente para vincular este acesso.
                </CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit}>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="identifier">E-mail ou CPF</Label>
                        <Input
                            id="identifier"
                            type="text"
                            autoComplete="username"
                            aria-invalid={!!errors.identifier}
                            {...register("identifier")}
                        />
                        {errors.identifier ? (
                            <p className="text-xs text-destructive">
                                {errors.identifier.message}
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
                <CardFooter className="flex flex-col gap-2">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Entrando..." : "Entrar e vincular"}
                    </Button>
                    <Link
                        href={`/register?invite=${encodeURIComponent(inviteCode)}`}
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            "w-full",
                        )}
                    >
                        Ainda não tenho conta
                    </Link>
                </CardFooter>
            </form>
        </Card>
    );
}
