"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";

import { syncClientRegistrationFaceAction } from "@/app/client/usuarios/actions";
import { syncCompanyRegistrationFaceAction } from "@/app/company/clientes/[clientId]/usuarios/actions";
import { isFaceSyncPending } from "@/lib/face-sync-result";

export function useRegistrationFaceSync(params: {
    variant: "client" | "company";
    companyClientId?: string;
    onAfterSync?: () => void;
}) {
    const { variant, companyClientId, onAfterSync } = params;
    const queryClient = useQueryClient();

    const runSync = useCallback(
        async (registrationId: string, name: string) => {
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
                    return null;
                }

                if (!isFaceSyncPending(res.deviceSyncStatus)) {
                    toast.error(
                        res.deviceSyncError ?? "Não foi possível sincronizar.",
                    );
                    onAfterSync?.();
                    return {
                        deviceSyncStatus: res.deviceSyncStatus,
                        deviceSyncError: res.deviceSyncError,
                    };
                }

                toast.success(
                    `Sync de ${name} enfileirado. Pode sair desta tela.`,
                );
                void queryClient.invalidateQueries({
                    queryKey: ["registration-face-sync-all"],
                });
                onAfterSync?.();
                return {
                    deviceSyncStatus: res.deviceSyncStatus,
                    deviceSyncError: res.deviceSyncError,
                };
            } catch {
                toast.error("Não foi possível sincronizar.");
                return null;
            }
        },
        [companyClientId, onAfterSync, queryClient, variant],
    );

    return {
        runSync,
    };
}
