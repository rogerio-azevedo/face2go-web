"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
    getInvitePreviewAction,
    registerWithInviteAction,
    type InvitePreview,
} from "@/app/register/actions";
import { deferInEffect } from "@/lib/defer-in-effect";
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
import { cn } from "@/lib/utils";

const companyRoleLabels: Record<string, string> = {
    company_admin: "Administrador da empresa",
    company_operator: "Operador",
};

const clientRoleLabels: Record<string, string> = {
    client_admin: "Administrador do cliente",
    client_operator: "Operador do cliente",
};

function inviteTitle(preview: InvitePreview): string {
    if (!preview) return "Cadastro";
    if (preview.inviteType === "company") {
        return `Cadastro — ${preview.companyName || "—"}`;
    }
    return `Cadastro — ${preview.clientName || "—"}`;
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

export function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const inviteCode = searchParams.get("invite")?.trim() ?? "";

    const [inviteLoading, setInviteLoading] = useState(!!inviteCode);
    const [preview, setPreview] = useState<InvitePreview>(null);

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [jobTitle, setJobTitle] = useState("");

    const [isPending, startTransition] = useTransition();

    const isCompanyInvite = preview?.inviteType === "company";
    const requiresCompanyProfile = isCompanyInvite;

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

    function nextFromStep1() {
        if (!email || !zEmail(email)) {
            toast.error("Informe um e-mail válido.");
            return;
        }
        if (password.length < 6) {
            toast.error("Senha deve ter pelo menos 6 caracteres.");
            return;
        }
        setStep(2);
    }

    function submitRegistration() {
        if (!preview) return;
        if (!name.trim() || name.trim().length < 2) {
            toast.error("Informe o nome completo.");
            return;
        }
        if (requiresCompanyProfile) {
            if (!phone.trim() || phone.replace(/\D/g, "").length < 8) {
                toast.error("Informe um telefone válido.");
                return;
            }
            if (!jobTitle.trim() || jobTitle.trim().length < 2) {
                toast.error("Informe o cargo.");
                return;
            }
        }

        startTransition(async () => {
            const result = await registerWithInviteAction({
                email: email.trim(),
                password,
                name: name.trim(),
                phone: requiresCompanyProfile ? phone.trim() : undefined,
                jobTitle: requiresCompanyProfile ? jobTitle.trim() : undefined,
                invite: inviteCode,
            });
            if (result.success) {
                toast.success(
                    "Cadastro concluído. Faça login e selecione o contexto.",
                );
                router.push("/login?registered=1");
            } else {
                toast.error(result.error);
            }
        });
    }

    if (!inviteCode) {
        return (
            <Card className="w-full max-w-md shadow-md">
                <CardHeader>
                    <CardTitle>Cadastro com convite</CardTitle>
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
                        Não foi possível usar este link. Solicite um novo convite à
                        administração.
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

    return (
        <Card className="w-full max-w-md shadow-md">
            <CardHeader>
                <CardTitle>{inviteTitle(preview)}</CardTitle>
                <CardDescription>
                    Contexto: <strong>{inviteContextLabel(preview)}</strong>
                    <br />
                    Papel: <strong>{inviteRoleLabel(preview)}</strong>
                    <br />
                    Etapa {step} de 2.
                </CardDescription>
            </CardHeader>
            {step === 1 ? (
                <>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">
                                Senha (ou confirme sua senha atual)
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Se você já tem conta no Face2Go, use a senha
                                atual para vincular este novo contexto.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <Button
                            type="button"
                            className="w-full"
                            onClick={nextFromStep1}
                        >
                            Continuar
                        </Button>
                        <Link
                            href="/login"
                            className={cn(
                                buttonVariants({ variant: "ghost" }),
                                "w-full",
                            )}
                        >
                            Já tenho conta
                        </Link>
                    </CardFooter>
                </>
            ) : (
                <>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome completo</Label>
                            <Input
                                id="name"
                                autoComplete="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        {requiresCompanyProfile ? (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Telefone</Label>
                                    <Input
                                        id="phone"
                                        autoComplete="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="jobTitle">Cargo</Label>
                                    <Input
                                        id="jobTitle"
                                        value={jobTitle}
                                        onChange={(e) =>
                                            setJobTitle(e.target.value)
                                        }
                                    />
                                </div>
                            </>
                        ) : null}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
                        <div className="flex w-full gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className={cn("flex-1")}
                                onClick={() => setStep(1)}
                                disabled={isPending}
                            >
                                Voltar
                            </Button>
                            <Button
                                type="button"
                                className="flex-1"
                                onClick={submitRegistration}
                                disabled={isPending}
                            >
                                {isPending ? "Enviando..." : "Concluir cadastro"}
                            </Button>
                        </div>
                    </CardFooter>
                </>
            )}
        </Card>
    );
}

function zEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
