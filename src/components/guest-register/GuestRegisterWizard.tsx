"use client";

import { useEffect, useState } from "react";

import {
    GuestFaceRegistrationStep,
    type GuestProfile,
} from "@/components/guest-register/GuestFaceRegistrationStep";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiBaseUrl } from "@/lib/api-fetch";
import { applyCpfMaskInput, CPF_FORMATTED_MAX_LENGTH, normalizeCpf } from "@/lib/utils/document";

type GuestRegisterPreview = {
    clientName: string;
    guestName: string;
    needsGuestData?: boolean;
    studentNames?: string[];
    validFrom: string;
    validUntil: string;
    guestApprovalStatus: string;
};

type GuestRegisterWizardProps = {
    code: string;
    apiPrefix: "pickup-register" | "invite-register";
    title: string;
    subtitleWithGuest: (name: string) => React.ReactNode;
    subtitleWithoutGuest: string;
    doneMessage: string;
    pendingApprovalMessage: string;
    contextBlock?: (preview: GuestRegisterPreview) => React.ReactNode;
};

function formatDate(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function GuestRegisterWizard({
    code,
    apiPrefix,
    title,
    subtitleWithGuest,
    subtitleWithoutGuest,
    doneMessage,
    pendingApprovalMessage,
    contextBlock,
}: GuestRegisterWizardProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<GuestRegisterPreview | null>(null);
    const [done, setDone] = useState(false);
    const [guestName, setGuestName] = useState("");
    const [guestDocument, setGuestDocument] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestProfile, setGuestProfile] = useState<GuestProfile | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        void (async () => {
            try {
                const url = `${getApiBaseUrl()}/api/${apiPrefix}/${encodeURIComponent(code.trim())}`;
                const res = await fetch(url, { signal: controller.signal });
                const data = (await res.json()) as unknown;
                if (!res.ok) {
                    const msg =
                        data &&
                        typeof data === "object" &&
                        "message" in data &&
                        typeof (data as { message: unknown }).message === "string"
                            ? (data as { message: string }).message
                            : "Link inválido ou expirado.";
                    throw new Error(msg);
                }
                setPreview(data as GuestRegisterPreview);
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") return;
                setError(e instanceof Error ? e.message : "Erro ao carregar.");
            } finally {
                setLoading(false);
            }
        })();
        return () => controller.abort();
    }, [code, apiPrefix]);

    if (loading) {
        return (
            <p className="py-12 text-center text-muted-foreground">Carregando…</p>
        );
    }

    if (error || !preview) {
        return (
            <p className="py-12 text-center text-destructive">
                {error ?? "Link inválido."}
            </p>
        );
    }

    if (done) {
        return (
            <div className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
                <h1 className="text-xl font-semibold text-emerald-700">
                    Cadastro enviado
                </h1>
                <p className="text-sm text-muted-foreground">{doneMessage}</p>
            </div>
        );
    }

    if (preview.guestApprovalStatus === "approved") {
        return (
            <div className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
                <h1 className="text-xl font-semibold">Foto já aprovada</h1>
                <p className="text-sm text-muted-foreground">
                    Sua face já foi aprovada para este cadastro.
                </p>
            </div>
        );
    }

    if (preview.guestApprovalStatus === "submitted") {
        return (
            <div className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
                <h1 className="text-xl font-semibold">Foto já enviada</h1>
                <p className="text-sm text-muted-foreground">
                    {pendingApprovalMessage}
                </p>
            </div>
        );
    }

    const needsGuestData = Boolean(preview.needsGuestData);
    const showGuestForm = needsGuestData && !guestProfile;

    const onConfirmGuestData = () => {
        const name = guestName.trim();
        const doc = normalizeCpf(guestDocument);
        if (!name || doc.length < 11) {
            return;
        }
        setGuestProfile({
            guestName: name,
            guestDocument: doc,
            guestPhone: guestPhone.trim() || null,
        });
    };

    return (
        <div className="mx-auto max-w-lg space-y-6 rounded-2xl border bg-card p-4 shadow-sm pt-4 md:p-6 md:pt-6">
            <header className="space-y-1 text-center">
                <p className="text-sm text-muted-foreground">{preview.clientName}</p>
                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">
                    {preview.guestName ? (
                        subtitleWithGuest(preview.guestName)
                    ) : (
                        subtitleWithoutGuest
                    )}
                </p>
            </header>

            <div className="rounded-lg bg-muted/50 p-4 text-sm">
                {contextBlock ? (
                    contextBlock(preview)
                ) : (
                    <p className="text-muted-foreground">
                        Vigência: {formatDate(preview.validFrom)} —{" "}
                        {formatDate(preview.validUntil)}
                    </p>
                )}
            </div>

            {showGuestForm ? (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="guestName">Nome completo</Label>
                        <Input
                            id="guestName"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            autoComplete="name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guestDocument">CPF</Label>
                        <Input
                            id="guestDocument"
                            value={guestDocument}
                            onChange={(e) =>
                                setGuestDocument(applyCpfMaskInput(e.target.value))
                            }
                            placeholder="000.000.000-00"
                            inputMode="numeric"
                            autoComplete="off"
                            maxLength={CPF_FORMATTED_MAX_LENGTH}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guestPhone">Telefone (opcional)</Label>
                        <Input
                            id="guestPhone"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            inputMode="tel"
                            autoComplete="tel"
                        />
                    </div>
                    <Button
                        type="button"
                        size="lg"
                        className="h-11 w-full"
                        onClick={onConfirmGuestData}
                        disabled={
                            !guestName.trim() ||
                            normalizeCpf(guestDocument).length < 11
                        }
                    >
                        Continuar para foto
                    </Button>
                </div>
            ) : (
                <GuestFaceRegistrationStep
                    code={code}
                    apiPrefix={apiPrefix}
                    guestProfile={guestProfile}
                    onCompleted={() => setDone(true)}
                />
            )}
        </div>
    );
}

function formatDateForBlock(iso: string) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export { formatDateForBlock };
