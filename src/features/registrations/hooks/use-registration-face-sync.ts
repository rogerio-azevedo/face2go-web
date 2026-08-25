"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { syncClientRegistrationFaceAction } from "@/app/client/usuarios/actions";
import { syncCompanyRegistrationFaceAction } from "@/app/company/clientes/[clientId]/usuarios/actions";
import type { FaceSyncModalState } from "@/components/company/clientes/escola/FaceSyncResultModal";

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
                setSyncModalState({
                    phase: "done",
                    name,
                    status: res.deviceSyncStatus,
                    error: res.deviceSyncError,
                });
                return {
                    deviceSyncStatus: res.deviceSyncStatus,
                    deviceSyncError: res.deviceSyncError,
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
