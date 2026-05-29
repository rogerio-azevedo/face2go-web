"use client";

import { useEffect, useState } from "react";

import { PickupFaceStep } from "@/components/retirada/PickupFaceStep";
import { getApiBaseUrl } from "@/lib/api-fetch";

type Preview = {
    clientName: string;
    guestName: string;
    studentNames: string[];
    validFrom: string;
    validUntil: string;
    guestApprovalStatus: string;
};

type RetiradaWizardProps = {
    code: string;
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

export function RetiradaWizard({ code }: RetiradaWizardProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        void (async () => {
            try {
                const url = `${getApiBaseUrl()}/api/pickup-register/${encodeURIComponent(code.trim())}`;
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
                setPreview(data as Preview);
            } catch (e) {
                if (e instanceof Error && e.name === "AbortError") return;
                setError(e instanceof Error ? e.message : "Erro ao carregar.");
            } finally {
                setLoading(false);
            }
        })();
        return () => controller.abort();
    }, [code]);

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
                <p className="text-sm text-muted-foreground">
                    O responsável que criou a autorização vai revisar sua foto. Você será
                    avisado conforme a combinação com a escola.
                </p>
            </div>
        );
    }

    if (preview.guestApprovalStatus === "approved") {
        return (
            <div className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
                <h1 className="text-xl font-semibold">Foto já aprovada</h1>
                <p className="text-sm text-muted-foreground">
                    Sua face já foi aprovada para esta autorização.
                </p>
            </div>
        );
    }

    if (preview.guestApprovalStatus === "submitted") {
        return (
            <div className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
                <h1 className="text-xl font-semibold">Foto já enviada</h1>
                <p className="text-sm text-muted-foreground">
                    Aguarde a aprovação do responsável.
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-lg space-y-6 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
            <header className="space-y-1 text-center">
                <p className="text-sm text-muted-foreground">{preview.clientName}</p>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Cadastro de face — retirada
                </h1>
                <p className="text-sm text-muted-foreground">
                    Olá, <strong>{preview.guestName}</strong>
                </p>
            </header>

            <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p>
                    <span className="font-medium">Aluno(s):</span>{" "}
                    {preview.studentNames.join(", ")}
                </p>
                <p className="mt-2 text-muted-foreground">
                    Vigência: {formatDate(preview.validFrom)} —{" "}
                    {formatDate(preview.validUntil)}
                </p>
            </div>

            <PickupFaceStep code={code} onCompleted={() => setDone(true)} />
        </div>
    );
}
