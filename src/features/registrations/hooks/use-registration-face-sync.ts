"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
    getClientRegistrationFaceSyncStatusAction,
    syncClientRegistrationFaceAction,
} from "@/app/client/usuarios/actions";
import {
    getCompanyRegistrationFaceSyncStatusAction,
    syncCompanyRegistrationFaceAction,
} from "@/app/company/clientes/[clientId]/usuarios/actions";
import type { FaceSyncModalState } from "@/components/company/clientes/escola/FaceSyncResultModal";
import {
    isFaceSyncPending,
    waitForFaceSyncSettled,
} from "@/lib/face-sync-result";

export function useRegistrationFaceSync(params: {
    variant: "client" | "company";
    companyClientId?: string;
    onAfterSync?: () => void;
}) {
    const { variant, companyClientId, onAfterSync } = params;
    const [syncModalState, setSyncModalState] = useState<FaceSyncModalState>({
        phase: "idle",
    });

    const closeSyncResult = useCallback(() => {
        setSyncModalState({ phase: "idle" });
        onAfterSync?.();
    }, [onAfterSync]);

    const runSync = useCallback(
        async (registrationId: string, name: string) => {
            setSyncModalState({ phase: "syncing", name });
            try {
                const res =
                    variant === "client"
                        ? await syncClientRegistrationFaceAction(registrationId)
                        : await syncCompanyRegistrationFaceAction(
                              companyClientId ?? "",
                              registrationId,
                          );
                if ("error" in res) {
                    toast.error(res.error);
                    setSyncModalState({ phase: "idle" });
                    return null;
                }

                let status = res.deviceSyncStatus;
                let error = res.deviceSyncError;
                if (isFaceSyncPending(status)) {
                    const settled = await waitForFaceSyncSettled(async () => {
                        const snapshot =
                            variant === "client"
                                ? await getClientRegistrationFaceSyncStatusAction(
                                      registrationId,
                                  )
                                : await getCompanyRegistrationFaceSyncStatusAction(
                                      companyClientId ?? "",
                                      registrationId,
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
                        return null;
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
                return {
                    deviceSyncStatus: status,
                    deviceSyncError: error,
                };
            } catch {
                toast.error("Não foi possível sincronizar.");
                setSyncModalState({ phase: "idle" });
                return null;
            }
        },
        [companyClientId, variant],
    );

    return {
        syncModalState,
        runSync,
        closeSyncResult,
    };
}
