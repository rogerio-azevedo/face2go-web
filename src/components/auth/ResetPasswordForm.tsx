"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { resetPasswordWithToken } from "@/lib/auth-contexts";
import {
    resetPasswordSchema,
    type ResetPasswordInput,
} from "@/lib/validations/auth";
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

type ResetPasswordFormProps = {
    token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordInput>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    const onSubmit = handleSubmit(async (data) => {
        setIsSubmitting(true);
        try {
            await resetPasswordWithToken(token, data.password);
            setCompleted(true);
            toast.success("Senha redefinida com sucesso.");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Não foi possível redefinir a senha.",
            );
        } finally {
            setIsSubmitting(false);
        }
    });

    if (completed) {
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
                        Senha redefinida
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        Sua senha foi atualizada. Você já pode entrar no
                        sistema ou no app.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="border-border/70 bg-muted/40">
                    <Link
                        href="/login"
                        className={buttonVariants({
                            size: "lg",
                            className: "h-11 w-full",
                        })}
                    >
                        Ir para o login
                    </Link>
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
                        Nova senha
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                        Escolha uma nova senha para sua conta.
                    </CardDescription>
                </div>
            </CardHeader>
            <form onSubmit={onSubmit}>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="password">Nova senha</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
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
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">Confirmar senha</Label>
                        <div className="relative">
                            <Input
                                id="confirmPassword"
                                type={
                                    showConfirmPassword ? "text" : "password"
                                }
                                autoComplete="new-password"
                                aria-invalid={!!errors.confirmPassword}
                                className="pe-11"
                                {...register("confirmPassword")}
                            />
                            <button
                                type="button"
                                aria-pressed={showConfirmPassword}
                                aria-label={
                                    showConfirmPassword
                                        ? "Ocultar confirmação de senha"
                                        : "Mostrar confirmação de senha"
                                }
                                className="text-muted-foreground hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute top-1/2 inset-e-2 z-10 -translate-y-1/2 rounded-md p-2 transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none"
                                disabled={isSubmitting}
                                onClick={() =>
                                    setShowConfirmPassword(
                                        (previous) => !previous,
                                    )
                                }
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="size-4" aria-hidden />
                                ) : (
                                    <Eye className="size-4" aria-hidden />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword ? (
                            <p className="text-xs text-destructive">
                                {errors.confirmPassword.message}
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
                        {isSubmitting ? "Salvando..." : "Salvar nova senha"}
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
