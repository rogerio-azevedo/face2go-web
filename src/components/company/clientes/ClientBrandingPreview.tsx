"use client";

import {
    contrastTextColor,
    isValidHttpUrl,
    resolvePrimaryColor,
} from "@/lib/branding";
import { cn } from "@/lib/utils";

type ClientBrandingPreviewProps = {
    logoUrl?: string | null;
    primaryColor?: string | null;
    className?: string;
};

export function ClientBrandingPreview({
    logoUrl,
    primaryColor,
    className,
}: ClientBrandingPreviewProps) {
    const resolvedPrimary = resolvePrimaryColor(primaryColor);
    const tintText = contrastTextColor(resolvedPrimary);
    const showLogo = isValidHttpUrl(logoUrl);

    return (
        <div
            className={cn(
                "bg-card space-y-4 rounded-xl border px-4 py-4 shadow-sm ring-1 ring-black/5",
                className,
            )}
        >
            <div className="space-y-1">
                <p className="text-foreground text-sm font-medium">
                    Pré-visualização no app
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                    Cores e logo aplicadas após login de responsáveis e usuários
                    do cliente.
                </p>
            </div>

            <div className="bg-muted/40 flex min-h-36 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-4">
                {showLogo ? (
                    <div className="bg-background flex h-16 w-full max-w-[200px] items-center justify-center rounded-lg border p-2 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={logoUrl!.trim()}
                            alt="Pré-visualização da logo do cliente"
                            className="max-h-12 max-w-full object-contain"
                        />
                    </div>
                ) : (
                    <div className="text-muted-foreground flex h-16 w-full max-w-[200px] items-center justify-center rounded-lg border border-dashed bg-background/80 text-xs">
                        Logo aparecerá aqui
                    </div>
                )}

                <button
                    type="button"
                    disabled
                    className="rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm"
                    style={{
                        backgroundColor: resolvedPrimary,
                        color: tintText,
                    }}
                >
                    Botão primário
                </button>
            </div>

            <p className="text-muted-foreground font-mono text-xs">
                {resolvedPrimary} · texto {tintText}
            </p>
        </div>
    );
}
