"use client";

import { useCallback, useRef, useState } from "react";

export type GlobalFaceSyncSseEvent =
    | { type: "start"; total: number }
    | {
          type: "progress";
          processed: number;
          synced: number;
          failed: number;
          total: number;
      }
    | {
          type: "item";
          registrationId: string;
          name: string | null;
          ok: boolean;
          error?: string;
      }
    | { type: "ping" }
    | { type: "done"; synced?: number; failed?: number; total?: number }
    | { type: "error"; message: string };

export type GlobalFaceSyncPhase =
    | "idle"
    | "connecting"
    | "running"
    | "done"
    | "error";

export type GlobalFaceSyncProgress = {
    total: number;
    processed: number;
    synced: number;
    failed: number;
};

export type GlobalFaceSyncItem = {
    label: string;
    ok: boolean;
    error?: string;
};

const EMPTY_PROGRESS: GlobalFaceSyncProgress = {
    total: 0,
    processed: 0,
    synced: 0,
    failed: 0,
};

export function useGlobalFaceSync() {
    const [phase, setPhase] = useState<GlobalFaceSyncPhase>("idle");
    const [progress, setProgress] =
        useState<GlobalFaceSyncProgress>(EMPTY_PROGRESS);
    const [items, setItems] = useState<GlobalFaceSyncItem[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const esRef = useRef<EventSource | null>(null);
    const finishedRef = useRef(false);

    const cleanup = useCallback(() => {
        esRef.current?.close();
        esRef.current = null;
    }, []);

    const reset = useCallback(() => {
        cleanup();
        finishedRef.current = false;
        setPhase("idle");
        setErrorMessage(null);
        setProgress(EMPTY_PROGRESS);
        setItems([]);
    }, [cleanup]);

    const start = useCallback(
        (url: string) => {
            cleanup();
            finishedRef.current = false;
            setPhase("connecting");
            setErrorMessage(null);
            setProgress(EMPTY_PROGRESS);
            setItems([]);

            const es = new EventSource(url);
            esRef.current = es;
            setPhase("running");

            es.onmessage = (ev) => {
                try {
                    const d = JSON.parse(ev.data) as GlobalFaceSyncSseEvent;
                    if (d.type === "start") {
                        setProgress((prev) => ({ ...prev, total: d.total }));
                    } else if (d.type === "progress") {
                        setProgress({
                            total: d.total,
                            processed: d.processed,
                            synced: d.synced,
                            failed: d.failed,
                        });
                    } else if (d.type === "item") {
                        const label = d.name?.trim() || d.registrationId;
                        setItems((prev) => [
                            ...prev,
                            {
                                label,
                                ok: d.ok,
                                error: d.error,
                            },
                        ]);
                        setProgress((prev) => ({
                            ...prev,
                            processed: prev.processed + 1,
                            synced: prev.synced + (d.ok ? 1 : 0),
                            failed: prev.failed + (d.ok ? 0 : 1),
                        }));
                    } else if (d.type === "done") {
                        finishedRef.current = true;
                        setProgress((prev) => ({
                            total:
                                d.total ??
                                (prev.total > 0 ? prev.total : prev.processed),
                            processed: prev.processed,
                            synced: d.synced ?? prev.synced,
                            failed: d.failed ?? prev.failed,
                        }));
                        setPhase("done");
                        cleanup();
                        es.close();
                    } else if (d.type === "error") {
                        finishedRef.current = true;
                        setErrorMessage(d.message);
                        setPhase("error");
                        cleanup();
                        es.close();
                    }
                } catch {
                    // ignora eventos malformados (ex.: ping legado)
                }
            };

            es.onerror = () => {
                if (finishedRef.current) return;
                setErrorMessage("Conexão com o servidor encerrada.");
                setPhase("error");
                cleanup();
            };
        },
        [cleanup],
    );

    const cancel = useCallback(() => {
        cleanup();
        finishedRef.current = true;
        setPhase("idle");
    }, [cleanup]);

    return {
        phase,
        progress,
        items,
        errorMessage,
        start,
        reset,
        cancel,
    };
}
