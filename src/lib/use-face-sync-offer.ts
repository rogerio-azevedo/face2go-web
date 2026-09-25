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
import {
    deviceSyncFailureMessage,
    isFaceSyncPending,
} from "@/lib/face-sync-result";
import { getPersonFaceSyncStatusAction } from "@/features/school/actions/face-sync";

type FaceSyncOfferTarget = { id: string; name: string };

const SETTLE_POLL_MS = 2500;
const SETTLE_POLL_MAX = 48;

async function waitForQueuedFaceSync(params: {
    clientId: string;
    id: string;
    kind: "student" | "responsible" | "member";
}): Promise<{ deviceSyncStatus: string; deviceSyncError: string | null } | null> {
    for (let attempt = 0; attempt < SETTLE_POLL_MAX; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, SETTLE_POLL_MS));
        const status = await getPersonFaceSyncStatusAction(
            params.clientId,
            params.id,
            params.kind,
        );
        if ("error" in status) return null;
        if (isFaceSyncPending(status.deviceSyncStatus)) continue;
        return {
            deviceSyncStatus: status.deviceSyncStatus,
            deviceSyncError: status.deviceSyncError,
        };
    }
    return null;
}

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
        async (
            id: string,
            name: string,
            options?: { allowSimilarFace?: boolean },
        ) => {
            const allowSimilarFace = options?.allowSimilarFace === true;
            setOfferTarget(null);
            try {
                const res =
                    kind === "student"
                        ? await syncStudentFaceAction(
                              clientId,
                              id,
                              allowSimilarFace,
                          )
                        : kind === "member"
                          ? await syncMemberFaceAction(
                                clientId,
                                id,
                                allowSimilarFace,
                            )
                          : await syncResponsibleFaceAction(
                                clientId,
                                id,
                                allowSimilarFace,
                            );
                if ("error" in res) {
                    toast.error(res.error);
                    return;
                }
                if (!isFaceSyncPending(res.deviceSyncStatus)) {
                    toast.error(
                        deviceSyncFailureMessage(res.deviceSyncError),
                    );
                    onAfterSync?.();
                    return;
                }
                toast.success(
                    allowSimilarFace
                        ? `Liberação de face parecida de ${name} enfileirada. Pode sair desta tela.`
                        : `Sync de ${name} enfileirado. Pode sair desta tela.`,
                );
                void queryClient.invalidateQueries({
                    queryKey: ["school-face-sync", clientId],
                });
                onAfterSync?.();
                void waitForQueuedFaceSync({ clientId, id, kind }).then(
                    (settled) => {
                        onAfterSync?.();
                        if (settled?.deviceSyncStatus !== "sync_failed") return;
                        toast.error(
                            deviceSyncFailureMessage(settled.deviceSyncError),
                        );
                    },
                );
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
