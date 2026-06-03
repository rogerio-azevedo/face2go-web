"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
    syncResponsibleFaceAction,
    syncStudentFaceAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type { FaceSyncModalState } from "@/components/company/clientes/escola/FaceSyncResultModal";
import type { FaceSyncSaveHint } from "@/lib/face-sync-after-edit";

type FaceSyncOfferTarget = { id: string; name: string };

export function useFaceSyncOffer(params: {
    clientId: string;
    kind: "student" | "responsible";
    onAfterSync?: () => void;
}) {
    const { clientId, kind, onAfterSync } = params;
    const [offerTarget, setOfferTarget] = useState<FaceSyncOfferTarget | null>(
        null,
    );
    const [syncModalState, setSyncModalState] = useState<FaceSyncModalState>({
        phase: "idle",
    });

    const promptFromSave = useCallback((hint?: FaceSyncSaveHint) => {
        if (hint?.requiresFaceSync) {
            setOfferTarget({ id: hint.id, name: hint.name });
        }
    }, []);

    const promptFromLinkChange = useCallback((hint?: FaceSyncSaveHint) => {
        if (hint?.requiresFaceSync) {
            setOfferTarget({ id: hint.id, name: hint.name });
        }
    }, []);

    const dismissOffer = useCallback(() => {
        setOfferTarget(null);
    }, []);

    const closeSyncResult = useCallback(() => {
        setSyncModalState({ phase: "idle" });
        onAfterSync?.();
    }, [onAfterSync]);

    const runSync = useCallback(
        async (id: string, name: string) => {
            setOfferTarget(null);
            setSyncModalState({ phase: "syncing", name });
            try {
                const res =
                    kind === "student"
                        ? await syncStudentFaceAction(clientId, id)
                        : await syncResponsibleFaceAction(clientId, id);
                if ("error" in res) {
                    toast.error(res.error);
                    setSyncModalState({ phase: "idle" });
                    return;
                }
                setSyncModalState({
                    phase: "done",
                    name,
                    status: res.deviceSyncStatus,
                    error: res.deviceSyncError,
                });
            } catch {
                toast.error("Não foi possível sincronizar.");
                setSyncModalState({ phase: "idle" });
            }
        },
        [clientId, kind],
    );

    const confirmOffer = useCallback(async () => {
        const target = offerTarget;
        if (!target) return;
        await runSync(target.id, target.name);
    }, [offerTarget, runSync]);

    return {
        offerTarget,
        syncModalState,
        promptFromSave,
        promptFromLinkChange,
        dismissOffer,
        confirmOffer,
        runSync,
        closeSyncResult,
    };
}
