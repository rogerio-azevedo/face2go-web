"use client";

import { useEffect, useState } from "react";

import { CadastroFaceStep } from "@/components/cadastro/CadastroFaceStep";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { getApiBaseUrl } from "@/lib/api-fetch";

type Preview = {
    clientName: string;
    logoUrl: string | null;
    firstName: string | null;
    guidance: string;
};

export function FaceRetakePage({ code }: { code: string }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [done, setDone] = useState(false);

    useEffect(() => {
        let cancel = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const url = `${getApiBaseUrl()}/api/register/retake/${encodeURIComponent(code.trim())}`;
                const controller = new AbortController();
                const timeoutId = window.setTimeout(
                    () => controller.abort(),
                    20_000,
                );
                const res = await fetch(url, { signal: controller.signal });
                window.clearTimeout(timeoutId);
                const data = (await res.json()) as unknown;
                if (!res.ok) {
                    const message =
                        data &&
                        typeof data === "object" &&
                        "message" in data &&
                        typeof (data as { message: unknown }).message ===
                            "string"
                            ? (data as { message: string }).message
                            : "Link inválido, expirado ou já utilizado.";
                    throw new Error(message);
                }
                if (!cancel) setPreview(data as Preview);
            } catch (err) {
                if (!cancel) {
                    if (err instanceof Error && err.name === "AbortError") {
                        setError(
                            "Tempo esgotado ao falar com o servidor. Confira a conexão e tente de novo.",
                        );
                    } else {
                        setError(
                            err instanceof Error
                                ? err.message
                                : "Erro ao carregar.",
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

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
                Carregando…
            </div>
        );
    }

    if (error || !preview) {
        return (
            <div className="flex min-h-[50vh] flex-col items-center justify-center px-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Link inválido</CardTitle>
                        <CardDescription>
                            {error ?? "Tente novamente."}
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (done) {
        return (
            <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-12">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>Foto atualizada</CardTitle>
                        <CardDescription>
                            Pode fechar esta página. A nova foto substitui a
                            anterior no seu cadastro.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const greeting = preview.firstName
        ? `Olá, ${preview.firstName}`
        : "Olá";

    return (
        <div className="mx-auto max-w-lg space-y-6 px-4 pt-8 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))]">
            <div className="space-y-2 text-center">
                {preview.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- logo público do cliente
                    <img
                        src={preview.logoUrl}
                        alt=""
                        className="mx-auto h-12 w-auto object-contain"
                    />
                ) : null}
                <h1 className="text-xl font-semibold">{preview.clientName}</h1>
                <p className="text-sm font-medium">{greeting}</p>
                <p className="text-sm text-muted-foreground">
                    {preview.guidance}
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Nova foto</CardTitle>
                    <CardDescription>
                        Centralize o rosto, com boa luz e fundo neutro.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CadastroFaceStep
                        code={code}
                        registrationId=""
                        uploadUrl={`${getApiBaseUrl()}/api/register/retake/${encodeURIComponent(code.trim())}/upload-photo`}
                        sendRegistrationId={false}
                        successToast="Foto atualizada."
                        uploadedMessage="Foto atualizada."
                        allowAnotherPhoto={false}
                        onUploaded={() => setDone(true)}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
