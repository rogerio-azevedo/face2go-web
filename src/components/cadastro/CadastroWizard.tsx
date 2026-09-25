"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { getApiBaseUrl, nestErrorMessage } from "@/lib/api-fetch";
import {
    CLIENT_TYPE_LABELS,
    type ClientType,
} from "@/lib/validations/clients";
import { CadastroFaceStep } from "@/components/cadastro/CadastroFaceStep";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    applyCpfCnpjMaskInput,
    CNPJ_FORMATTED_MAX_LENGTH,
    isValidCnpj,
    isValidCpf,
    isValidCpfOrCnpj,
    onlyDigits,
} from "@/lib/utils/document";
import {
    applyBirthDateMaskInput,
    BIRTH_DATE_FORMATTED_MAX_LENGTH,
    birthDateMaskToIso,
} from "@/lib/utils/date";
import { applyPhoneMaskInput } from "@/lib/utils/phone";
import {
    defaultConfigForClientType,
    isFieldRequired,
    isFieldVisible,
    type ResolvedRegistrationFieldsConfig,
} from "@/features/registrations/validations/registration-config";

type Preview = {
    clientName: string;
    clientType: string;
    logoUrl: string | null;
    fields?: ResolvedRegistrationFieldsConfig;
};

function optionalLabel(base: string, required: boolean) {
    return required ? base : `${base} (opcional)`;
}

function phoneFieldError(value: string): string | null {
    const digits = onlyDigits(value);
    if (digits.length === 0 || digits.length === 10 || digits.length === 11) {
        return null;
    }
    return "Informe o telefone com DDD (10 ou 11 dígitos).";
}

function cpfCnpjFieldError(value: string): string | null {
    const digits = onlyDigits(value);
    if (digits.length === 11) {
        return isValidCpf(digits) ? null : "CPF inválido. Confira os números.";
    }
    if (digits.length === 14) {
        return isValidCnpj(digits) ? null : "CNPJ inválido. Confira os números.";
    }
    return null;
}

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
    const [birthDate, setBirthDate] = useState("");
    const [block, setBlock] = useState("");
    const [unit, setUnit] = useState("");
    const [room, setRoom] = useState("");

    const [truthDeclared, setTruthDeclared] = useState(false);
    const [faceImageKey, setFaceImageKey] = useState<string | null>(null);
    const submitActionsRef = useRef<HTMLDivElement>(null);
    const [submitting, setSubmitting] = useState(false);
    const [checkingDocument, setCheckingDocument] = useState(false);
    const [documentConflict, setDocumentConflict] = useState<string | null>(
        null,
    );

    const fields = useMemo(
        () =>
            preview?.fields ??
            defaultConfigForClientType(preview?.clientType ?? "other"),
        [preview],
    );
    const showLocalStep =
        isFieldVisible(fields.block) ||
        isFieldVisible(fields.unit) ||
        isFieldVisible(fields.room);

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

    const canStep1 = useMemo(() => {
        if (name.trim().length < 2) return false;
        if (isFieldVisible(fields.document)) {
            const digits = onlyDigits(document);
            if (isFieldRequired(fields.document) && !digits) return false;
            if (digits && !isValidCpfOrCnpj(document)) return false;
        }
        if (isFieldVisible(fields.phone)) {
            const phoneDigits = onlyDigits(phone);
            if (isFieldRequired(fields.phone) && phoneDigits.length === 0) {
                return false;
            }
            if (phoneFieldError(phone)) return false;
        }
        if (isFieldVisible(fields.email)) {
            if (isFieldRequired(fields.email) && !email.includes("@")) {
                return false;
            }
            if (email.trim() && !email.includes("@")) return false;
        }
        if (isFieldVisible(fields.birthDate)) {
            const iso = birthDateMaskToIso(birthDate);
            if (isFieldRequired(fields.birthDate) && !iso) return false;
            if (birthDate.trim() && !iso) return false;
        }
        if (!truthDeclared) return false;
        return true;
    }, [name, document, phone, email, birthDate, fields, truthDeclared]);

    const documentFormatError = useMemo(
        () =>
            isFieldVisible(fields.document) ? cpfCnpjFieldError(document) : null,
        [document, fields.document],
    );
    const documentError = documentFormatError ?? documentConflict;
    const phoneError = useMemo(
        () => (isFieldVisible(fields.phone) ? phoneFieldError(phone) : null),
        [phone, fields.phone],
    );

    const canStep2 = useMemo(() => {
        if (isFieldRequired(fields.block) && !block.trim()) return false;
        if (isFieldRequired(fields.unit) && !unit.trim()) return false;
        if (isFieldRequired(fields.room) && !room.trim()) return false;
        return true;
    }, [fields, block, unit, room]);

    function goToPhoto() {
        setStep(3);
    }

    async function continueFromStep1() {
        if (isFieldVisible(fields.document)) {
            const digits = onlyDigits(document);
            if (digits) {
                setCheckingDocument(true);
                setDocumentConflict(null);
                try {
                    const res = await fetch(
                        `${getApiBaseUrl()}/api/register/${encodeURIComponent(code.trim())}/check-document`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ document: digits }),
                        },
                    );
                    if (!res.ok) {
                        const data = await res.json();
                        const message = nestErrorMessage(data);
                        setDocumentConflict(message);
                        toast.error(message);
                        return;
                    }
                } catch {
                    toast.error("Não foi possível verificar o CPF/CNPJ.");
                    return;
                } finally {
                    setCheckingDocument(false);
                }
            }
        }
        if (showLocalStep) setStep(2);
        else goToPhoto();
    }

    async function handleSubmit() {
        if (!faceImageKey) {
            toast.error("Envie uma foto.");
            return;
        }
        const additionalData: Record<string, string> = {};
        if (isFieldVisible(fields.block)) additionalData.block = block.trim();
        if (isFieldVisible(fields.unit)) additionalData.unit = unit.trim();
        if (isFieldVisible(fields.room)) additionalData.room = room.trim();

        setSubmitting(true);
        try {
            const res = await fetch(
                `${getApiBaseUrl()}/api/register/${encodeURIComponent(code.trim())}/submit`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        registrationId,
                        name: name.trim(),
                        document: isFieldVisible(fields.document)
                            ? onlyDigits(document) || undefined
                            : undefined,
                        phone: isFieldVisible(fields.phone)
                            ? phone.trim() || undefined
                            : undefined,
                        email: isFieldVisible(fields.email)
                            ? email.trim() || undefined
                            : undefined,
                        birthDate: isFieldVisible(fields.birthDate)
                            ? birthDateMaskToIso(birthDate)
                            : undefined,
                        faceImageKey,
                        additionalData:
                            Object.keys(additionalData).length > 0
                                ? additionalData
                                : undefined,
                        truthDeclared: true,
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

    const photoStepNumber = showLocalStep ? 3 : 2;

    return (
        <div className="mx-auto max-w-lg space-y-6 px-4 pt-8 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
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
                {showLocalStep ? (
                    <>
                        <span>·</span>
                        <span className={step >= 2 ? "font-medium text-foreground" : ""}>
                            2 Local
                        </span>
                    </>
                ) : null}
                <span>·</span>
                <span className={step >= 3 ? "font-medium text-foreground" : ""}>
                    {photoStepNumber} Foto
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
                        {isFieldVisible(fields.document) ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="doc">
                                    {optionalLabel(
                                        "CPF ou CNPJ",
                                        isFieldRequired(fields.document),
                                    )}
                                </Label>
                                <Input
                                    id="doc"
                                    value={document}
                                    onChange={(e) => {
                                        setDocumentConflict(null);
                                        setDocument(
                                            applyCpfCnpjMaskInput(e.target.value),
                                        );
                                    }}
                                    placeholder="000.000.000-00"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={CNPJ_FORMATTED_MAX_LENGTH}
                                    aria-invalid={!!documentError}
                                    aria-describedby={
                                        documentError ? "doc-error" : undefined
                                    }
                                />
                                {documentError ? (
                                    <p
                                        id="doc-error"
                                        role="alert"
                                        className="text-sm text-destructive"
                                    >
                                        {documentError}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                        {isFieldVisible(fields.phone) ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="ph">
                                    {optionalLabel(
                                        "Telefone",
                                        isFieldRequired(fields.phone),
                                    )}
                                </Label>
                                <Input
                                    id="ph"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) =>
                                        setPhone(applyPhoneMaskInput(e.target.value))
                                    }
                                    placeholder="(00) 00000-0000"
                                    inputMode="numeric"
                                    autoComplete="tel-national"
                                    aria-invalid={!!phoneError}
                                    aria-describedby={
                                        phoneError ? "ph-error" : undefined
                                    }
                                />
                                {phoneError ? (
                                    <p
                                        id="ph-error"
                                        role="alert"
                                        className="text-sm text-destructive"
                                    >
                                        {phoneError}
                                    </p>
                                ) : null}
                            </div>
                        ) : null}
                        {isFieldVisible(fields.email) ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="em">
                                    {optionalLabel(
                                        "E-mail",
                                        isFieldRequired(fields.email),
                                    )}
                                </Label>
                                <Input
                                    id="em"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>
                        ) : null}
                        {isFieldVisible(fields.birthDate) ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="bd">
                                    {optionalLabel(
                                        "Data de nascimento",
                                        isFieldRequired(fields.birthDate),
                                    )}
                                </Label>
                                <Input
                                    id="bd"
                                    type="text"
                                    value={birthDate}
                                    onChange={(e) =>
                                        setBirthDate(
                                            applyBirthDateMaskInput(
                                                e.target.value,
                                            ),
                                        )
                                    }
                                    placeholder="DD/MM/AAAA"
                                    inputMode="numeric"
                                    autoComplete="bday"
                                    maxLength={BIRTH_DATE_FORMATTED_MAX_LENGTH}
                                />
                            </div>
                        ) : null}
                        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3">
                            <Checkbox
                                id="truth"
                                checked={truthDeclared}
                                onCheckedChange={(v) =>
                                    setTruthDeclared(v === true)
                                }
                                className="mt-0.5"
                            />
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="truth"
                                    className="text-xs font-normal leading-snug text-muted-foreground"
                                >
                                    Declaro, sob pena da lei, que os dados e a
                                    foto enviados são meus e verdadeiros.
                                    Informações falsas podem cancelar o
                                    cadastro e sujeitar o responsável às
                                    sanções legais.
                                </Label>
                                <p className="text-xs leading-snug text-muted-foreground">
                                    Ao seguir, você concorda com as políticas
                                    de privacidade:{" "}
                                    <a
                                        href="https://www.face2go.com.br/privacy-policy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-brand-cyan-blue underline"
                                    >
                                        Privacidade
                                    </a>.
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            size="lg"
                            className="h-11 w-full"
                            disabled={!canStep1 || checkingDocument}
                            onClick={() => void continueFromStep1()}
                        >
                            {checkingDocument ? "Verificando…" : "Continuar"}
                        </Button>
                    </CardContent>
                </Card>
            ) : null}

            {step === 2 ? (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informações do local</CardTitle>
                        <CardDescription>
                            {isFieldVisible(fields.block) || isFieldVisible(fields.unit)
                                ? "Informe bloco e unidade."
                                : isFieldVisible(fields.room)
                                  ? "Informe a sala."
                                  : "Nenhum dado extra necessário."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {isFieldVisible(fields.block) ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="bl">
                                    {optionalLabel(
                                        "Bloco",
                                        isFieldRequired(fields.block),
                                    )}
                                </Label>
                                <Input
                                    id="bl"
                                    value={block}
                                    onChange={(e) => setBlock(e.target.value)}
                                />
                            </div>
                        ) : null}
                        {isFieldVisible(fields.unit) ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="un">
                                    {optionalLabel(
                                        "Unidade",
                                        isFieldRequired(fields.unit),
                                    )}
                                </Label>
                                <Input
                                    id="un"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                />
                            </div>
                        ) : null}
                        {isFieldVisible(fields.room) ? (
                            <div className="space-y-1.5">
                                <Label htmlFor="rm">
                                    {optionalLabel(
                                        "Sala",
                                        isFieldRequired(fields.room),
                                    )}
                                </Label>
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
                                size="lg"
                                variant="outline"
                                className="h-11 flex-1"
                                onClick={() => setStep(1)}
                            >
                                Voltar
                            </Button>
                            <Button
                                type="button"
                                size="lg"
                                className="h-11 flex-1"
                                disabled={!canStep2}
                                onClick={() => goToPhoto()}
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
                            onUploaded={(key) => {
                                setFaceImageKey(key);
                                window.requestAnimationFrame(() => {
                                    submitActionsRef.current?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                    });
                                });
                            }}
                            onUploadCleared={() => setFaceImageKey(null)}
                        />
                        <div ref={submitActionsRef} className="flex gap-2 pt-2">
                            <Button
                                type="button"
                                size="lg"
                                variant="outline"
                                className="h-11 flex-1"
                                onClick={() => {
                                    setFaceImageKey(null);
                                    setStep(showLocalStep ? 2 : 1);
                                }}
                            >
                                Voltar
                            </Button>
                            <Button
                                type="button"
                                size="lg"
                                className="h-11 flex-1"
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
