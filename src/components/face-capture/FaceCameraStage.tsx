"use client";

import { useEffect, type ReactNode } from "react";

const DEFAULT_INSTRUCTION =
    "Centralize o rosto na moldura oval, com boa luz e sem óculos escuros.";

type FaceCameraStageProps = {
    children: ReactNode;
    showOval?: boolean;
    instruction?: string;
    message?: string | null;
    actions: ReactNode;
};

export function FaceCameraStage({
    children,
    showOval = false,
    instruction = DEFAULT_INSTRUCTION,
    message,
    actions,
}: FaceCameraStageProps) {
    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex h-dvh flex-col bg-black">
            <div className="mx-auto w-full shrink-0 pt-[env(safe-area-inset-top)] max-w-[min(100%,420px,calc(60dvh*3/4))]">
                <div className="relative overflow-hidden bg-black">
                    {children}
                    {showOval ? (
                        <div
                            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                            aria-hidden
                        >
                            <div className="aspect-[3/4] w-[72%] max-w-[260px] rounded-[100%] border-[3px] border-white/90 shadow-[0_0_0_200vmax_rgba(0,0,0,0.45)]" />
                        </div>
                    ) : null}
                </div>
            </div>

            <p className="px-6 pt-3 text-center text-sm text-white/80">
                {instruction}
            </p>

            {message ? (
                <p className="px-6 pt-2 text-center text-sm text-red-300">
                    {message}
                </p>
            ) : null}

            <div className="mx-auto grid w-full max-w-[min(100%,420px)] grid-cols-2 gap-3 px-4 pt-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))]">
                {actions}
            </div>
        </div>
    );
}
