"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { getApiBaseUrl } from "@/lib/api-fetch";
import {
    CLIENT_TYPE_LABELS,
    type ClientType,
} from "@/lib/validations/clients";
import { CadastroFaceStep } from "@/components/cadastro/CadastroFaceStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { applyCpfMaskInput, CPF_FORMATTED_MAX_LENGTH, normalizeCpf } from "@/lib/utils/document";

type Preview = {
    clientName: string;
    clientType: string;
    logoUrl: string | null;
};

export function CadastroWizard({ code }: { code: string }) {
    const [registrationId] = useState(() =>
        typeof crypto !== "undefined" ? crypto.randomUUID() : "",
    );

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [document, setDocument] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [block, setBlock] = useState("");
    const [unit, setUnit] = useState("");
    const [room, setRoom] = useState("");

    const [faceImageKey, setFaceImageKey] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const clientType = preview?.clientType as ClientType | undefined;

    useEffect(() => {
        let cancel = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const url = `${getApiBaseUrl()}/api/register/${encodeURIComponent(code.trim())}`;
                const controller = new AbortController();
                const timeoutId = window.setTimeout(() => controller.abort(), 20_000);
                const res = await fetch(url, { signal: controller.signal });
                window.clearTimeout(timeoutId);
                const data = (await res.json()) as unknown;
                if (!res.ok) {
                    const msg =
                        data &&
                        typeof data === "object" &&
                        "message" in data &&
                        typeof (data as { message: unknown }).message === "string"
                            ? (data as { message: string }).message
                            : "Link inválido.";
                    throw new Error(msg);
                }
                const p = data as Preview;
                if (!cancel) {
                    setPreview(p);
                    setStep(1);
                }
            } catch (e) {
                if (!cancel) {
                    if (e instanceof Error && e.name === "AbortError") {
                        setError(
                            "Tempo esgotado ao falar com o servidor. No celular, confira se o Wi‑Fi é o mesmo do computador, se a API (Nest) está rodando e se o firewall libera a porta da API.",
                        );
                    } else {
                        setError(
                            e instanceof Error ? e.message : "Erro ao carregar.",
                        );
                    }
                }
            } finally {
                if (!cancel) setLoading(false);
            }
        })();
        return () => {
            cancel = true;
        };
    }, [code]);

    const needsCondo = clientType === "condominium";
    const needsRoom =
        clientType === "office" || clientType === "clinic";

    const canStep1 = useMemo(() => {
        return (
            name.trim().length >= 2 &&
            document.trim().length >= 5 &&
            phone.trim().length >= 8 &&
            email.includes("@")
        );
    }, [name, document, phone, email]);

    const canStep2 = useMemo(() => {
        if (needsCondo) return block.trim() && unit.trim();
        if (needsRoom) return room.trim();
        return true;
    }, [needsCondo, needsRoom, block, unit, room]);

    async function handleSubmit() {
        if (!faceImageKey) {
            toast.error("Envie uma foto.");
            return;
        }
        const regId = registrationId;
        let additionalData: Record<string, string> | undefined;
        if (needsCondo) {
            additionalData = {
                block: block.trim(),
                unit: unit.trim(),
            };
        } else if (needsRoom) {
            additionalData = { room: room.trim() };
        }

        setSubmitting(true);
        try {
            const res = await fetch(
                `${getApiBaseUrl()}/api/register/${encodeURIComponent(code.trim())}/submit`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        registrationId: regId,
                        name: name.trim(),
                        document: normalizeCpf(document) || document.trim(),
                        phone: phone.trim(),
                        email: email.trim(),
                        faceImageKey,
                        additionalData,
                    }),
                },
            );
            const data = (await res.json()) as {
                message?: string | string[];
                success?: boolean;
            };
            if (!res.ok) {
                const m = Array.isArray(data.message)
                    ? data.message.join(", ")
                    : typeof data.message === "string"
                      ? data.message
                      : "Não foi possível enviar.";
                throw new Error(m);
            }
            toast.success("Cadastro enviado!");
            setStep(4);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Erro ao enviar.");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading && !preview && !error) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
                Carregando…
            </div>
        );
    }

    if (error || !preview) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle>Link inválido</CardTitle>
                        <CardDescription>{error ?? "Tente novamente."}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/"
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
                        >
                            Início
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (step === 4) {
        return (
            <div className="mx-auto flex max-w-md flex-col gap-4 py-12">
                <Card>
                    <CardHeader>
                        <CardTitle>Tudo certo!</CardTitle>
                        <CardDescription>
                            Seu cadastro foi recebido. O administrador vai analisar e
                            aprovar em breve.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href="/"
                            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted"
                        >
                            Fechar
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-lg space-y-6 py-8 px-4">
            <div className="text-center">
                <h1 className="text-xl font-semibold">{preview.clientName}</h1>
                <p className="text-sm text-muted-foreground">
                    Cadastro ·{" "}
                    {CLIENT_TYPE_LABELS[preview.clientType as ClientType] ??
                        preview.clientType}
                </p>
            </div>

            <div className="flex justify-center gap-2 text-xs text-muted-foreground">
                <span className={step >= 1 ? "font-medium text-foreground" : ""}>
                    1 Dados
                </span>
                <span>·</span>
                <span className={step >= 2 ? "font-medium text-foreground" : ""}>
                    2 Local
                </span>
                <span>·</span>
                <span className={step >= 3 ? "font-medium text-foreground" : ""}>
                    3 Foto
                </span>
            </div>

            {step === 1 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Seus dados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="nm">Nome completo</Label>
                            <Input
                                id="nm"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="doc">CPF ou documento</Label>
                            <Input
                                id="doc"
                                value={document}
                                onChange={(e) =>
                                    setDocument(applyCpfMaskInput(e.target.value))
                                }
                                placeholder="000.000.000-00"
                                inputMode="numeric"
                                autoComplete="off"
                                maxLength={CPF_FORMATTED_MAX_LENGTH}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ph">Telefone</Label>
                            <Input
                                id="ph"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                autoComplete="tel"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="em">E-mail</Label>
                            <Input
                                id="em"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                        <Button
                            type="button"
                            className="w-full"
                            disabled={!canStep1}
                            onClick={() => setStep(2)}
                        >
                            Continuar
                        </Button>
                    </CardContent>
                </Card>
            ) : null}

            {step === 2 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informações do local</CardTitle>
                        <CardDescription>
                            {needsCondo
                                ? "Informe bloco e unidade."
                                : needsRoom
                                  ? "Informe a sala."
                                  : "Nenhum dado extra necessário."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {needsCondo ? (
                            <>
                                <div className="space-y-1.5">
                                    <Label htmlFor="bl">Bloco</Label>
                                    <Input
                                        id="bl"
                                        value={block}
                                        onChange={(e) => setBlock(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="un">Unidade</Label>
                                    <Input
                                        id="un"
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value)}
                                    />
                                </div>
                            </>
                        ) : null}
                        {needsRoom ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="rm">Sala</Label>
                                <Input
                                    id="rm"
                                    value={room}
                                    onChange={(e) => setRoom(e.target.value)}
                                />
                            </div>
                        ) : null}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setStep(1)}
                            >
                                Voltar
                            </Button>
                            <Button
                                type="button"
                                className="flex-1"
                                disabled={!canStep2}
                                onClick={() => setStep(3)}
                            >
                                Continuar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {step === 3 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Foto do rosto</CardTitle>
                        <CardDescription>
                            Use a câmera para uma foto nítida, de frente, com boa iluminação.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <CadastroFaceStep
                            code={code.trim()}
                            registrationId={registrationId}
                            onUploaded={(key) => setFaceImageKey(key)}
                            onUploadCleared={() => setFaceImageKey(null)}
                        />
                        <div className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setFaceImageKey(null);
                                    setStep(2);
                                }}
                            >
                                Voltar
                            </Button>
                            <Button
                                type="button"
                                className="flex-1"
                                disabled={!faceImageKey || submitting}
                                onClick={() => void handleSubmit()}
                            >
                                {submitting ? "Enviando…" : "Enviar cadastro"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : null}
        </div>
    );
}
