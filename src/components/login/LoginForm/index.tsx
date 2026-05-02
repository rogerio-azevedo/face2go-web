"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const errorParam = searchParams.get("error");
    const registeredParam = searchParams.get("registered");
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const onSubmit = handleSubmit(async (data) => {
        setIsSubmitting(true);
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("E-mail ou senha inválidos.");
                return;
            }

            toast.success("Login realizado.");
            router.push("/");
            router.refresh();
        } finally {
            setIsSubmitting(false);
        }
    });

    return (
        <Card className="w-full max-w-md shadow-md">
            <CardHeader>
                <CardTitle>Faciem</CardTitle>
                <CardDescription>
                    Entre com sua conta para continuar.
                </CardDescription>
                {errorParam ? (
                    <p className="text-sm text-destructive">{errorParam}</p>
                ) : null}
            </CardHeader>
            <form onSubmit={onSubmit}>
                <CardContent className="flex flex-col gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
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
                        <Input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            aria-invalid={!!errors.password}
                            {...register("password")}
                        />
                        {errors.password ? (
                            <p className="text-xs text-destructive">
                                {errors.password.message}
                            </p>
                        ) : null}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Entrando..." : "Entrar"}
                    </Button>
                    <Link
                        href="/register"
                        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        Cadastro com convite
                    </Link>
                    <Link
                        href="/"
                        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                    >
                        Voltar
                    </Link>
                </CardFooter>
            </form>
        </Card>
    );
}
