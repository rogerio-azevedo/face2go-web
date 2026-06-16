"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FaceLiveCameraPanel } from "@/components/face-capture/FaceLiveCameraPanel";
import { Button } from "@/components/ui/button";
import { useFaceLiveCamera } from "@/hooks/use-face-live-camera";
import { getApiBaseUrl } from "@/lib/api-fetch";
import { compressFaceForRegistrationUpload } from "@/lib/cadastro-face";

export type ResponsibleRegisterFormData = {
    name: string;
    phone: string;
    document: string;
    plate: string;
    brand: string;
    model: string;
    color: string;
};

type ResponsibleRegisterFaceStepProps = {
    code: string;
    formData: ResponsibleRegisterFormData;
    onCompleted: () => void;
    onBack: () => void;
};

export function ResponsibleRegisterFaceStep({
    code,
    formData,
    onCompleted,
    onBack,
}: ResponsibleRegisterFaceStepProps) {
    const [faceImageKey, setFaceImageKey] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const camera = useFaceLiveCamera({
        onCaptureReset: () => setFaceImageKey(null),
    });

    const uploadPreview = async () => {
        if (!camera.previewDataUrl) return;
        camera.setMessage(null);
        camera.setStatus("uploading");
        try {
            const compressed = await compressFaceForRegistrationUpload(
                camera.previewDataUrl,
            );
            const res = await fetch(
                `${getApiBaseUrl()}/api/responsible-register/${encodeURIComponent(code.trim())}/upload-photo`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64: compressed }),
                },
            );
            const data = (await res.json()) as {
                faceImageKey?: string;
                message?: string | string[];
            };
            if (!res.ok) {
                const m = Array.isArray(data.message)
                    ? data.message.join(", ")
                    : (data.message ?? "Falha ao enviar a foto.");
                throw new Error(m);
            }
            if (!data.faceImageKey) throw new Error("Resposta inválida.");
            setFaceImageKey(data.faceImageKey);
            camera.setStatus("uploaded");
            toast.success("Foto enviada.");
        } catch (err) {
            camera.setStatus("preview_local");
            const text =
                err instanceof Error ? err.message : "Não foi possível enviar.";
            camera.setMessage(text);
            toast.error(text);
        }
    };

    const submitRegistration = async () => {
        if (!faceImageKey) {
            toast.error("Envie a foto antes de concluir.");
            return;
        }
        setSubmitting(true);
        try {
            const hasVehicle = formData.plate.trim().length > 0;
            const body: Record<string, unknown> = {
                name: formData.name.trim(),
                phone: formData.phone.trim() || undefined,
                document: formData.document.trim(),
                faceImageKey,
            };
            if (hasVehicle) {
                body.vehicle = {
                    plate: formData.plate.trim(),
                    brand: formData.brand.trim(),
                    model: formData.model.trim(),
                    color: formData.color.trim(),
                };
            }

            const res = await fetch(
                `${getApiBaseUrl()}/api/responsible-register/${encodeURIComponent(code.trim())}/submit`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                },
            );
            const data = (await res.json()) as {
                success?: boolean;
                message?: string | string[];
            };
            if (!res.ok) {
                const m = Array.isArray(data.message)
                    ? data.message.join(", ")
                    : (data.message ?? "Falha ao concluir.");
                throw new Error(m);
            }
            toast.success(
                typeof data.message === "string"
                    ? data.message
                    : "Cadastro enviado. Aguarde a aprovação do responsável.",
            );
            onCompleted();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Não foi possível concluir.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4">
            <FaceLiveCameraPanel
                videoRef={camera.videoRef}
                captureInputRef={camera.captureInputRef}
                status={camera.status}
                previewDataUrl={camera.previewDataUrl}
                message={camera.message}
                useNativeCapture={camera.useNativeCapture}
                onCaptureFromVideo={camera.captureFromVideo}
                onCancelLive={() => {
                    camera.stopCamera();
                    camera.setStatus("idle");
                }}
                onOpenCameraClick={camera.onOpenCameraClick}
                onHiddenCaptureChange={camera.onHiddenCaptureChange}
                previewActions={
                    <>
                        {camera.status === "preview_local" ? (
                            <>
                                <Button
                                    type="button"
                                    size="lg"
                                    className="h-11 w-full"
                                    onClick={() => void uploadPreview()}
                                >
                                    Enviar esta foto
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    className="h-11 w-full"
                                    onClick={camera.resetCapture}
                                >
                                    Tirar de novo
                                </Button>
                            </>
                        ) : null}
                        {camera.status === "uploading" ? (
                            <p className="py-2 text-center text-sm text-muted-foreground">
                                Otimizando e enviando a foto…
                            </p>
                        ) : null}
                        {camera.status === "uploaded" ? (
                            <Button
                                type="button"
                                size="lg"
                                className="h-11 w-full"
                                disabled={submitting}
                                onClick={() => void submitRegistration()}
                            >
                                {submitting ? "Enviando…" : "Concluir cadastro"}
                            </Button>
                        ) : null}
                    </>
                }
            />
            <Button type="button" variant="outline" className="w-full" onClick={onBack}>
                Voltar aos dados
            </Button>
        </div>
    );
}
