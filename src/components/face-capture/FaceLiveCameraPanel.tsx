"use client";

import { Camera } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { FaceCaptureStatus } from "@/hooks/use-face-live-camera";
import { cn } from "@/lib/utils";

type FaceLiveCameraPanelProps = {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    captureInputRef: React.RefObject<HTMLInputElement | null>;
    status: FaceCaptureStatus;
    previewDataUrl: string | null;
    message: string | null;
    useNativeCapture: boolean;
    onCaptureFromVideo: () => void;
    onCancelLive: () => void;
    onOpenCameraClick: () => void;
    onHiddenCaptureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    previewActions?: ReactNode;
};

export function FaceLiveCameraPanel({
    videoRef,
    captureInputRef,
    status,
    previewDataUrl,
    message,
    useNativeCapture,
    onCaptureFromVideo,
    onCancelLive,
    onOpenCameraClick,
    onHiddenCaptureChange,
    previewActions,
}: FaceLiveCameraPanelProps) {
    return (
        <div className="space-y-4">
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
                    <div className="mx-auto flex w-full max-w-[min(100%,320px)] flex-col gap-2">
                        <Button
                            type="button"
                            size="lg"
                            className="h-11 w-full"
                            onClick={onCaptureFromVideo}
                        >
                            <Camera className="mr-2 size-4" />
                            Capturar
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            className="h-11 w-full"
                            onClick={onCancelLive}
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
                    {previewActions ? (
                        <div className="mx-auto flex w-full max-w-[min(100%,320px)] flex-col gap-2">
                            {previewActions}
                        </div>
                    ) : null}
                </div>
            ) : null}

            {status === "idle" ? (
                <div className="mx-auto flex w-full max-w-[min(100%,320px)] flex-col gap-2">
                    <Button
                        type="button"
                        size="lg"
                        className="h-11 w-full"
                        onClick={onOpenCameraClick}
                    >
                        <Camera className="mr-2 size-4" />
                        {useNativeCapture ? "Abrir câmera" : "Usar câmera"}
                    </Button>
                    {message ? (
                        <p className="text-center text-sm text-destructive">
                            {message}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {status !== "idle" &&
            message &&
            status !== "uploading" &&
            status !== "uploaded" ? (
                <p className={cn("text-center text-sm text-destructive")}>
                    {message}
                </p>
            ) : null}

            <p className="text-center text-sm text-muted-foreground">
                Centralize o rosto na moldura oval, com boa luz e sem óculos
                escuros.
            </p>
        </div>
    );
}
