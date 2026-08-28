"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { syncMemberFaceAction } from "@/app/company/clientes/[clientId]/usuarios/members-actions";
import {
    getPersonFaceSyncStatusAction,
    syncResponsibleFaceAction,
    syncStudentFaceAction,
} from "@/app/company/clientes/[clientId]/usuarios/escola-actions";
import type { FaceSyncModalState } from "@/components/company/clientes/escola/FaceSyncResultModal";
import type { FaceSyncSaveHint } from "@/lib/face-sync-after-edit";
import {
    isFaceSyncPending,
    waitForFaceSyncSettled,
} from "@/lib/face-sync-result";

type FaceSyncOfferTarget = { id: string; name: string };

export function useFaceSyncOffer(params: {
    clientId: string;
    kind: "student" | "responsible" | "member";
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
                        : kind === "member"
                          ? await syncMemberFaceAction(clientId, id)
                          : await syncResponsibleFaceAction(clientId, id);
                if ("error" in res) {
                    toast.error(res.error);
                    setSyncModalState({ phase: "idle" });
                    return;
                }

                let status = res.deviceSyncStatus;
                let error = res.deviceSyncError;
                if (isFaceSyncPending(status)) {
                    const settled = await waitForFaceSyncSettled(async () => {
                        const snapshot = await getPersonFaceSyncStatusAction(
                            clientId,
                            id,
                            kind,
                        );
                        if ("error" in snapshot) return snapshot;
                        return {
                            deviceSyncStatus: snapshot.deviceSyncStatus,
                            deviceSyncError: snapshot.deviceSyncError,
                        };
                    });
                    if ("error" in settled) {
                        toast.error(settled.error);
                        setSyncModalState({ phase: "idle" });
                        return;
                    }
                    status = settled.deviceSyncStatus;
                    error = settled.deviceSyncError;
                }

                setSyncModalState({
                    phase: "done",
                    name,
                    status,
                    error,
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
