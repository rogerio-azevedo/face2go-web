"use client";

import { useEffect, useState } from "react";

import {
    GuestFaceRegistrationStep,
} from "@/components/guest-register/GuestFaceRegistrationStep";
import { PublicRegistrationDataStep } from "@/components/public-registration/PublicRegistrationDataStep";
import {
    emptyPublicRegistrationForm,
    type PublicRegistrationFormData,
} from "@/components/public-registration/types";
import { getApiBaseUrl } from "@/lib/api-fetch";

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
    const [step, setStep] = useState<"data" | "face">("data");
    const [formData, setFormData] = useState<PublicRegistrationFormData>(
        emptyPublicRegistrationForm(),
    );

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
                const previewData = data as GuestRegisterPreview;
                setPreview(previewData);
                setFormData((prev) => ({
                    ...prev,
                    name: previewData.guestName?.trim() ?? "",
                }));
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

    const namePrefilled = Boolean(preview.guestName?.trim());

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

            {step === "data" ? (
                <PublicRegistrationDataStep
                    initial={formData}
                    nameReadOnly={namePrefilled}
                    onNext={(data) => {
                        setFormData(data);
                        setStep("face");
                    }}
                />
            ) : (
                <GuestFaceRegistrationStep
                    code={code}
                    apiPrefix={apiPrefix}
                    formData={formData}
                    onCompleted={() => setDone(true)}
                    onBack={() => setStep("data")}
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
