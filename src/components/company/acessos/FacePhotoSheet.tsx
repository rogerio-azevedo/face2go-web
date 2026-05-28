"use client";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { FacialAccessPhotoUrl } from "@/types/domain";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loading: boolean;
    error: string | null;
    url: FacialAccessPhotoUrl | null;
    /** Ex.: nome da pessoa para contexto no painel */
    subtitle?: string;
};

function PhotoBlock({
    title,
    src,
}: {
    title: string;
    src: string;
}) {
    return (
        <figure className="space-y-2">
            <figcaption className="text-xs font-medium text-muted-foreground">
                {title}
            </figcaption>
            <div className="flex max-h-[min(640px,75vh)] w-full items-center justify-center overflow-hidden rounded-md border bg-muted p-2">
                {/* URLs presignadas R2 não passam pelo otimizador Next */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={title}
                    className="max-h-[min(640px,75vh)] w-full object-contain"
                />
            </div>
        </figure>
    );
}

export function FacePhotoSheet({
    open,
    onOpenChange,
    loading,
    error,
    url,
    subtitle,
}: Props) {
    const snapUrl = url?.snapUrl ?? null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton
                className="w-full gap-6 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:!max-w-4xl"
            >
                <SheetHeader>
                    <SheetTitle>Foto do acesso facial</SheetTitle>
                    <SheetDescription>
                        {subtitle
                            ? `Captura de ${subtitle} — armazenada no R2`
                            : "Captura do evento armazenada no R2 (link temporário)."}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6 px-4 pb-4">
                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-40 w-full rounded-md" />
                        </div>
                    ) : null}

                    {!loading && error ? (
                        <p className="text-sm text-destructive">{error}</p>
                    ) : null}

                    {!loading && !error && url && !snapUrl ? (
                        <p className="text-sm text-muted-foreground">
                            Não foi possível obter a URL da imagem. Verifique
                            as credenciais R2 ou tente novamente.
                        </p>
                    ) : null}

                    {!loading && !error && snapUrl ? (
                        <PhotoBlock title="Captura facial" src={snapUrl} />
                    ) : null}
                </div>
            </SheetContent>
        </Sheet>
    );
}
