"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { getClientFaceSyncProgressSseUrlAction } from "@/app/client/usuarios/actions";
import { getCompanyFaceSyncProgressSseUrlAction } from "@/app/company/clientes/[clientId]/usuarios/actions";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

type SseEvt =
    | { type: "start"; total: number }
    | {
          type: "item";
          registrationId: string;
          name: string | null;
          ok: boolean;
          error?: string;
      }
    | { type: "done" }
    | { type: "error"; message: string };

export function SyncAllProgressModal({
    variant,
    companyClientId,
}: {
    variant: "client" | "company";
    companyClientId?: string;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [running, setRunning] = useState(false);
    const [lines, setLines] = useState<string[]>([]);
    const esRef = useRef<EventSource | null>(null);

    const cleanup = useCallback(() => {
        esRef.current?.close();
        esRef.current = null;
    }, []);

    const append = useCallback((s: string) => {
        setLines((prev) => [...prev, s]);
    }, []);

    const start = useCallback(async () => {
        setLines([]);
        setRunning(true);
        cleanup();

        const urlResult =
            variant === "client"
                ? await getClientFaceSyncProgressSseUrlAction()
                : await getCompanyFaceSyncProgressSseUrlAction(
                      companyClientId ?? "",
                  );

        if ("error" in urlResult) {
            toast.error(urlResult.error);
            setRunning(false);
            return;
        }

        const es = new EventSource(urlResult.url);
        esRef.current = es;

        es.onmessage = (ev) => {
            try {
                const d = JSON.parse(ev.data) as SseEvt;
                if (d.type === "start") {
                    append(`Iniciando: ${d.total} cadastro(s) pendente(s).`);
                } else if (d.type === "item") {
                    const label = d.name?.trim() || d.registrationId;
                    if (d.ok) {
                        append(`✓ ${label}`);
                    } else {
                        append(
                            `✗ ${label}: ${d.error ?? "falha"}`,
                        );
                    }
                } else if (d.type === "done") {
                    append("Concluído.");
                    setRunning(false);
                    cleanup();
                    es.close();
                    toast.success("Sincronização em lote finalizada.");
                    router.refresh();
                } else if (d.type === "error") {
                    append(`Erro: ${d.message}`);
                    setRunning(false);
                    cleanup();
                    es.close();
                    toast.error(d.message);
                }
            } catch {
                append(`(parse) ${ev.data}`);
            }
        };

        es.onerror = () => {
            append("Conexão SSE encerrada.");
            setRunning(false);
            cleanup();
        };
    }, [append, cleanup, companyClientId, router, variant]);

    return (
        <>
            <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                    setOpen(true);
                    setLines([]);
                }}
            >
                <RefreshCw className="h-4 w-4" />
                Sincronizar todos no leitor
            </Button>
            <Sheet
                open={open}
                onOpenChange={(v) => {
                    if (!v) {
                        cleanup();
                        setRunning(false);
                    }
                    setOpen(v);
                }}
            >
                <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Sincronizar faces nos leitores</SheetTitle>
                        <SheetDescription>
                            Envia cada cadastro aprovado pendente para todos os
                            leitores Intelbras ativos deste cliente. Use após
                            trocar o equipamento.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-3 px-4">
                        <Button
                            type="button"
                            disabled={running}
                            onClick={() => void start()}
                        >
                            {running ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Em andamento…
                                </>
                            ) : (
                                "Iniciar sincronização"
                            )}
                        </Button>
                        <div className="bg-muted max-h-[50vh] overflow-y-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">
                            {lines.length === 0 ? (
                                <span className="text-muted-foreground">
                                    Clique em “Iniciar sincronização”.
                                </span>
                            ) : (
                                lines.map((l, i) => (
                                    // eslint-disable-next-line react/no-array-index-key -- log lines
                                    <div key={i}>{l}</div>
                                ))
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    );
}
