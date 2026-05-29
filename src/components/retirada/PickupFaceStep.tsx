"use client";

import { Camera } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getApiBaseUrl } from "@/lib/api-fetch";
import {
    compressFaceForRegistrationUpload,
    preferNativeCameraInput,
} from "@/lib/cadastro-face";
import { cn } from "@/lib/utils";

type FaceStepStatus =
    | "idle"
    | "live"
    | "preview_local"
    | "uploading"
    | "uploaded";

type PickupFaceStepProps = {
    code: string;
    onCompleted: () => void;
};

export function PickupFaceStep({ code, onCompleted }: PickupFaceStepProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const captureInputRef = useRef<HTMLInputElement>(null);

    const [status, setStatus] = useState<FaceStepStatus>("idle");
    const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [faceImageKey, setFaceImageKey] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const useNativeCapture = preferNativeCameraInput();

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const v = videoRef.current;
        if (v) {
            v.onloadedmetadata = null;
            v.srcObject = null;
        }
    }, []);

    useEffect(() => () => stopCamera(), [stopCamera]);

    /** O <video> só existe com status "live"; o stream tem que ser ligado depois do mount. */
    useEffect(() => {
        if (status !== "live") return;
        const video = videoRef.current;
        const stream = streamRef.current;
        if (!video || !stream) return;

        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;

        const tryPlay = () => {
            void video.play().catch(() => undefined);
        };
        tryPlay();
        video.onloadedmetadata = tryPlay;

        return () => {
            video.onloadedmetadata = null;
            video.srcObject = null;
        };
    }, [status]);

    const startLiveCamera = async () => {
        setMessage(null);
        if (!navigator.mediaDevices?.getUserMedia) {
            setMessage(
                "Use HTTPS ou abra pelo celular para acessar a câmera.",
            );
            return;
        }
        try {
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: "user",
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                    audio: false,
                });
            } catch {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user" },
                    audio: false,
                });
            }
            streamRef.current = stream;
            setStatus("live");
        } catch {
            setMessage(
                "Não foi possível acessar a câmera. Verifique permissões.",
            );
        }
    };

    const captureFromVideo = () => {
        const video = videoRef.current;
        if (!video || video.videoWidth === 0) return;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        stopCamera();
        setPreviewDataUrl(dataUrl);
        setStatus("preview_local");
        setFaceImageKey(null);
    };

    const onHiddenCaptureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string") {
                setPreviewDataUrl(result);
                setStatus("preview_local");
                setFaceImageKey(null);
            }
        };
        reader.readAsDataURL(file);
    };

    const uploadPreview = async () => {
        if (!previewDataUrl) return;
        setMessage(null);
        setStatus("uploading");
        try {
            const compressed = await compressFaceForRegistrationUpload(
                previewDataUrl,
            );
            const res = await fetch(
                `${getApiBaseUrl()}/api/pickup-register/${encodeURIComponent(code.trim())}/upload-photo`,
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
            setStatus("uploaded");
            toast.success("Foto enviada.");
        } catch (err) {
            setStatus("preview_local");
            const text =
                err instanceof Error ? err.message : "Não foi possível enviar.";
            setMessage(text);
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
            const res = await fetch(
                `${getApiBaseUrl()}/api/pickup-register/${encodeURIComponent(code.trim())}/submit`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ faceImageKey }),
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
            <p className="text-center text-sm text-muted-foreground">
                Centralize o rosto na moldura oval, com boa luz e sem óculos escuros.
            </p>

            <input
                ref={captureInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={onHiddenCaptureChange}
            />

            {status === "live" ? (
                <div className="space-y-3">
                    <div className="relative z-0 mx-auto max-w-[min(100%,320px)] overflow-hidden rounded-2xl bg-black">
                        <video
                            ref={videoRef}
                            className="relative z-0 aspect-[3/4] w-full object-cover [transform:scaleX(-1)]"
                            autoPlay
                            playsInline
                            muted
                        />
                        <div
                            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                            aria-hidden
                        >
                            <div className="aspect-[3/4] w-[72%] max-w-[240px] rounded-[100%] border-[3px] border-white/90 shadow-[0_0_0_200vmax_rgba(0,0,0,0.5)]" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" className="flex-1" onClick={captureFromVideo}>
                            <Camera className="mr-2 size-4" />
                            Capturar
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                stopCamera();
                                setStatus("idle");
                            }}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            ) : null}

            {previewDataUrl && status !== "live" ? (
                <div className="space-y-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewDataUrl}
                        alt="Prévia do rosto"
                        className="mx-auto max-h-72 w-full max-w-sm rounded-2xl border object-contain bg-muted"
                    />
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                        {status === "preview_local" ? (
                            <>
                                <Button type="button" onClick={() => void uploadPreview()}>
                                    Enviar esta foto
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setPreviewDataUrl(null);
                                        setStatus("idle");
                                        setFaceImageKey(null);
                                        stopCamera();
                                    }}
                                >
                                    Tirar de novo
                                </Button>
                            </>
                        ) : null}
                        {status === "uploading" ? (
                            <p className="py-2 text-center text-sm text-muted-foreground">
                                Otimizando e enviando a foto…
                            </p>
                        ) : null}
                        {status === "uploaded" ? (
                            <Button
                                type="button"
                                className="w-full"
                                disabled={submitting}
                                onClick={() => void submitRegistration()}
                            >
                                {submitting ? "Enviando…" : "Concluir cadastro de face"}
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : null}

            {status === "idle" ? (
                <Button
                    type="button"
                    className="w-full"
                    onClick={() =>
                        useNativeCapture
                            ? captureInputRef.current?.click()
                            : void startLiveCamera()
                    }
                >
                    <Camera className="mr-2 size-4" />
                    {useNativeCapture ? "Abrir câmera" : "Usar câmera"}
                </Button>
            ) : null}

            {message ? (
                <p className={cn("text-center text-sm text-destructive")}>{message}</p>
            ) : null}
        </div>
    );
}
