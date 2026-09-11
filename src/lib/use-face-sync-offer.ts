"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { syncMemberFaceAction } from "@/app/company/clientes/[clientId]/usuarios/members-actions";
import {
    syncResponsibleFaceAction,
    syncStudentFaceAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type { FaceSyncSaveHint } from "@/lib/face-sync-after-edit";
import { isFaceSyncPending } from "@/lib/face-sync-result";

type FaceSyncOfferTarget = { id: string; name: string };

export function useFaceSyncOffer(params: {
    clientId: string;
    kind: "student" | "responsible" | "member";
    onAfterSync?: () => void;
}) {
    const { clientId, kind, onAfterSync } = params;
    const queryClient = useQueryClient();
    const [offerTarget, setOfferTarget] = useState<FaceSyncOfferTarget | null>(
        null,
    );

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

    const runSync = useCallback(
        async (id: string, name: string) => {
            setOfferTarget(null);
            try {
                const res =
                    kind === "student"
                        ? await syncStudentFaceAction(clientId, id)
                        : kind === "member"
                          ? await syncMemberFaceAction(clientId, id)
                          : await syncResponsibleFaceAction(clientId, id);
                if ("error" in res) {
                    toast.error(res.error);
                    return;
                }
                if (!isFaceSyncPending(res.deviceSyncStatus)) {
                    toast.error(
                        res.deviceSyncError ?? "Não foi possível sincronizar.",
                    );
                    onAfterSync?.();
                    return;
                }
                toast.success(
                    `Sync de ${name} enfileirado. Pode sair desta tela.`,
                );
                void queryClient.invalidateQueries({
                    queryKey: ["school-face-sync", clientId],
                });
                onAfterSync?.();
            } catch {
                toast.error("Não foi possível sincronizar.");
            }
        },
        [clientId, kind, onAfterSync, queryClient],
    );

    const confirmOffer = useCallback(async () => {
        const target = offerTarget;
        if (!target) return;
        await runSync(target.id, target.name);
    }, [offerTarget, runSync]);

    return {
        offerTarget,
        promptFromSave,
        promptFromLinkChange,
        dismissOffer,
        confirmOffer,
        runSync,
    };
}
