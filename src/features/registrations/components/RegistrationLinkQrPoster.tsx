"use client";

import type { Ref } from "react";
import QRCode from "react-qr-code";

import { cn } from "@/lib/utils";

export function RegistrationLinkQrPoster({
    clientName,
    code,
    url,
    qrWrapperRef,
    variant = "preview",
}: {
    clientName: string;
    code: string;
    url: string;
    qrWrapperRef?: Ref<HTMLDivElement>;
    variant?: "preview" | "print";
}) {
    const isPrint = variant === "print";
    const qrSize = isPrint ? 360 : 220;

    return (
        <article
            className={cn(
                "flex flex-col items-center bg-brand-white text-center text-brand-midnight-navy",
                isPrint
                    ? "w-[148mm] min-h-[210mm] justify-center gap-8 px-10 py-12"
                    : "gap-5 rounded-xl border px-6 py-8",
            )}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/face2go_dark.svg"
                alt="Face2Go"
                className={cn(
                    "shrink-0 object-contain",
                    isPrint ? "h-12 max-w-[220px]" : "h-9 max-w-[180px]",
                )}
            />
            <div className="space-y-1">
                <h2
                    className={cn(
                        "font-heading font-semibold tracking-tight text-balance",
                        isPrint ? "text-3xl" : "text-xl",
                    )}
                >
                    {clientName}
                </h2>
                <p
                    className={cn(
                        "text-brand-slate",
                        isPrint ? "text-lg" : "text-sm",
                    )}
                >
                    Escaneie o QR Code para se cadastrar
                </p>
            </div>
            <div
                ref={qrWrapperRef}
                className={cn("bg-brand-white", isPrint ? "p-4" : "p-2")}
            >
                <QRCode
                    value={url}
                    size={qrSize}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                />
            </div>
            <p
                className={cn(
                    "font-mono tracking-widest",
                    isPrint ? "text-xl" : "text-sm",
                )}
            >
                {code}
            </p>
        </article>
    );
}
