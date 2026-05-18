"use client";

import { Copy, MonitorPlay, RefreshCw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import {
    ensureClientDisplayTokenAction,
    regenerateClientDisplayTokenAction,
} from "@/app/company/clientes/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

type ClientMini = { id: string; name: string };

export function ClientTvDisplaySheet(props: {
    client: ClientMini | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { client, open, onOpenChange } = props;
    const [token, setToken] = useState<string | null>(null);
    const [loading, startTransition] = useTransition();

    useEffect(() => {
        if (!open || !client) {
            setToken(null);
            return;
        }
        setToken(null);
        startTransition(async () => {
            const r = await ensureClientDisplayTokenAction(client.id);
            if ("error" in r) {
                toast.error(r.error);
                setToken(null);
                return;
            }
            setToken(r.token);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega ao abrir o sheet / mudar cliente
    }, [open, client?.id]);

    const displayUrl =
        typeof window !== "undefined" && client && token
            ? `${window.location.origin}/display/${client.id}?token=${encodeURIComponent(token)}`
            : "";

    const copyUrl = async () => {
        if (!displayUrl) {
            toast.error("URL ainda indisponível.");
            return;
        }
        try {
            await navigator.clipboard.writeText(displayUrl);
            toast.success("URL copiada.");
        } catch {
            toast.error("Não foi possível copiar.");
        }
    };

    const regenerate = () => {
        if (!client?.id) return;
        startTransition(async () => {
            const r = await regenerateClientDisplayTokenAction(client.id);
            if ("error" in r) {
                toast.error(r.error);
                return;
            }
            setToken(r.token);
            toast.success("Novo token gerado. Atualize a TV com a nova URL.");
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex h-full w-full max-w-[min(100vw,42rem)] flex-col gap-5 overflow-y-auto px-6 pb-8 pt-6 sm:max-w-2xl sm:px-8 sm:pb-10"
            >
                <SheetHeader className="space-y-2 p-0">
                    <SheetTitle className="flex items-center gap-2 text-lg">
                        <MonitorPlay className="size-5 shrink-0" aria-hidden />
                        Display TV
                    </SheetTitle>
                    <SheetDescription>
                        Tela em tempo real para a escola: abra num navegador de
                        TV com esta URL. Mostra o último responsável que passou
                        pelo leitor e a fila recente.
                    </SheetDescription>
                </SheetHeader>

                {client ? (
                    <p className="-mt-1 text-sm font-medium text-foreground/90">
                        {client.name}
                    </p>
                ) : null}

                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        URL do display
                    </p>
                    <Input
                        readOnly
                        value={
                            loading && !displayUrl
                                ? "Carregando…"
                                : (displayUrl ?? "")
                        }
                        className="font-mono text-xs sm:text-sm"
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={loading || !displayUrl}
                        onClick={() => void copyUrl()}
                    >
                        <Copy className="size-4" aria-hidden />
                        Copiar URL
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={regenerate}
                    >
                        <RefreshCw className="size-4" aria-hidden />
                        Novo token
                    </Button>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                    Regenerar invalida URLs antigas. Use com moderação se a URL
                    vazar.
                </p>
            </SheetContent>
        </Sheet>
    );
}
