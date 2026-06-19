"use client";

import { useEffect, useState } from "react";

import { PublicRegistrationDataStep } from "@/components/public-registration/PublicRegistrationDataStep";
import {
    emptyPublicRegistrationForm,
    type PublicRegistrationFormData,
} from "@/components/public-registration/types";
import { getApiBaseUrl } from "@/lib/api-fetch";
import { RELATIONSHIP_TYPE_LABELS } from "@/lib/validations/school";

import { ResponsibleRegisterFaceStep } from "./ResponsibleRegisterFaceStep";

type Preview = {
    clientName: string;
    inviterName: string | null;
    studentLinks: Array<{
        studentName: string;
        relationshipType: string;
        isAuthorizedPickup: boolean;
    }>;
    status: string;
    faceApprovalStatus: string;
};

type ResponsibleRegisterWizardProps = {
    code: string;
};

/** @deprecated Use PublicRegistrationFormData */
export type ResponsibleRegisterFormData = PublicRegistrationFormData;

export function ResponsibleRegisterWizard({ code }: ResponsibleRegisterWizardProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [done, setDone] = useState(false);
    const [step, setStep] = useState<"data" | "face">("data");
    const [formData, setFormData] = useState<PublicRegistrationFormData>(
        emptyPublicRegistrationForm(),
    );

    useEffect(() => {
        const controller = new AbortController();
        void (async () => {
            try {
                const url = `${getApiBaseUrl()}/api/responsible-register/${encodeURIComponent(code.trim())}`;
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

    if (done || preview.status === "submitted") {
        return (
            <div className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
                <h1 className="text-xl font-semibold text-emerald-700">
                    Cadastro enviado
                </h1>
                <p className="text-sm text-muted-foreground">
                    O responsável que convidou vai revisar seu cadastro. Você será
                    avisado conforme a combinação com a escola.
                </p>
            </div>
        );
    }

    if (preview.status === "approved") {
        return (
            <div className="mx-auto max-w-md space-y-4 rounded-2xl border bg-card p-8 text-center shadow-sm">
                <h1 className="text-xl font-semibold">Cadastro já aprovado</h1>
                <p className="text-sm text-muted-foreground">
                    Seu cadastro já foi aprovado. Você já pode retirar o(s)
                    aluno(s) vinculado(s).
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-lg space-y-6 rounded-2xl border bg-card p-4 shadow-sm pt-4 md:p-6 md:pt-6">
            <header className="space-y-1 text-center">
                <p className="text-sm text-muted-foreground">{preview.clientName}</p>
                <h1 className="text-xl font-semibold tracking-tight">
                    Cadastro de responsável
                </h1>
                {preview.inviterName ? (
                    <p className="text-sm text-muted-foreground">
                        Convite de <strong>{preview.inviterName}</strong>
                    </p>
                ) : null}
            </header>

            <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-2">
                <p className="font-medium">Aluno(s) vinculados:</p>
                <ul className="list-disc pl-5 space-y-1">
                    {preview.studentLinks.map((link) => (
                        <li key={link.studentName}>
                            {link.studentName} —{" "}
                            {RELATIONSHIP_TYPE_LABELS[
                                link.relationshipType as keyof typeof RELATIONSHIP_TYPE_LABELS
                            ] ?? link.relationshipType}
                            {link.isAuthorizedPickup ? " (autorizado a retirar)" : ""}
                        </li>
                    ))}
                </ul>
            </div>

            {step === "data" ? (
                <PublicRegistrationDataStep
                    initial={formData}
                    nameLabel="Nome"
                    onNext={(data) => {
                        setFormData(data);
                        setStep("face");
                    }}
                />
            ) : (
                <ResponsibleRegisterFaceStep
                    code={code}
                    formData={formData}
                    onCompleted={() => setDone(true)}
                    onBack={() => setStep("data")}
                />
            )}
        </div>
    );
}
