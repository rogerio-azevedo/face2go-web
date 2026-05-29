"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { preferNativeCameraInput } from "@/lib/cadastro-face";

export type FaceCaptureStatus =
    | "idle"
    | "live"
    | "preview_local"
    | "uploading"
    | "uploaded";

type UseFaceLiveCameraOptions = {
    onCaptureReset?: () => void;
};

export function useFaceLiveCamera(options: UseFaceLiveCameraOptions = {}) {
    const { onCaptureReset } = options;
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const captureInputRef = useRef<HTMLInputElement>(null);

    const [status, setStatus] = useState<FaceCaptureStatus>("idle");
    const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

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

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

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
        onCaptureReset?.();
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        setPreviewDataUrl(dataUrl);
        stopCamera();
        setStatus("preview_local");
    };

    const onHiddenCaptureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !file.type.startsWith("image/")) {
            toast.error("Selecione uma imagem.");
            return;
        }
        onCaptureReset?.();
        const reader = new FileReader();
        reader.onload = () => {
            const r = reader.result as string;
            setPreviewDataUrl(r);
            setStatus("preview_local");
        };
        reader.readAsDataURL(file);
    };

    const resetCapture = () => {
        onCaptureReset?.();
        setPreviewDataUrl(null);
        setStatus("idle");
        setMessage(null);
        stopCamera();
    };

    const onOpenCameraClick = () => {
        setMessage(null);
        if (useNativeCapture) {
            captureInputRef.current?.click();
        } else {
            void startLiveCamera();
        }
    };

    return {
        videoRef,
        captureInputRef,
        status,
        setStatus,
        previewDataUrl,
        setPreviewDataUrl,
        message,
        setMessage,
        useNativeCapture,
        stopCamera,
        startLiveCamera,
        captureFromVideo,
        onHiddenCaptureChange,
        onOpenCameraClick,
        resetCapture,
    };
}
