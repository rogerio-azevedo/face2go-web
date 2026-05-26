"use client";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { LprAccessPhotoUrls } from "@/types/domain";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loading: boolean;
    error: string | null;
    urls: LprAccessPhotoUrls | null;
    /** Ex.: número da placa para contexto no painel */
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
            <div className="flex max-h-[min(360px,50vh)] w-full items-center justify-center overflow-hidden rounded-md border bg-muted p-2">
                {/* URLs presignadas R2 não passam pelo otimizador Next */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={title}
                    className="max-h-[min(360px,50vh)] w-auto max-w-full object-contain"
                />
            </div>
        </figure>
    );
}

export function LprPhotoSheet({
    open,
    onOpenChange,
    loading,
    error,
    urls,
    subtitle,
}: Props) {
    const hasAny =
        urls &&
        (urls.cutoutUrl ?? urls.vehicleUrl ?? urls.normalUrl) != null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton
                className="w-full gap-6 overflow-y-auto sm:max-w-lg"
            >
                <SheetHeader>
                    <SheetTitle>Fotos do acesso LPR</SheetTitle>
                    <SheetDescription>
                        {subtitle
                            ? `Placa ${subtitle} — capturas armazenadas no R2`
                            : "Capturas do evento armazenadas no R2 (links temporários)."}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-6 px-4 pb-4">
                    {loading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-40 w-full rounded-md" />
                            <Skeleton className="h-40 w-full rounded-md" />
                        </div>
                    ) : null}

                    {!loading && error ? (
                        <p className="text-sm text-destructive">{error}</p>
                    ) : null}

                    {!loading && !error && urls && !hasAny ? (
                        <p className="text-sm text-muted-foreground">
                            Não foi possível obter URLs das imagens. Verifique
                            as credenciais R2 ou tente novamente.
                        </p>
                    ) : null}

                    {!loading && !error && urls?.cutoutUrl ? (
                        <PhotoBlock title="Recorte da placa" src={urls.cutoutUrl} />
                    ) : null}

                    {!loading && !error && urls?.vehicleUrl ? (
                        <PhotoBlock title="Veículo" src={urls.vehicleUrl} />
                    ) : null}

                    {!loading && !error && urls?.normalUrl ? (
                        <PhotoBlock title="Cena completa" src={urls.normalUrl} />
                    ) : null}
                </div>
            </SheetContent>
        </Sheet>
    );
}
