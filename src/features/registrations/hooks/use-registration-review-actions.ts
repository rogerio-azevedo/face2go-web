"use client";

import { useCallback } from "react";

import {
    approveClientRegistrationAction,
    blockClientRegistrationAction,
    rejectClientRegistrationAction,
    unblockClientRegistrationAction,
} from "@/app/client/cadastros/actions";
import {
    approveCompanyRegistrationAction,
    blockCompanyRegistrationAction,
    rejectCompanyRegistrationAction,
    unblockCompanyRegistrationAction,
} from "@/app/company/clientes/[clientId]/usuarios/actions";

type ReviewResult = { success: true } | { error: string };

export function useRegistrationReviewActions({
    variant,
    companyClientId,
}: {
    variant: "client" | "company";
    companyClientId?: string;
}) {
    const missingClient = useCallback((): ReviewResult | null => {
        if (variant === "company" && !companyClientId) {
            return { error: "Cliente inválido." };
        }
        return null;
    }, [companyClientId, variant]);

    const approve = useCallback(
        async (registrationId: string): Promise<ReviewResult> => {
            const invalid = missingClient();
            if (invalid) return invalid;
            if (variant === "client") {
                return approveClientRegistrationAction(registrationId);
            }
            return approveCompanyRegistrationAction(
                companyClientId!,
                registrationId,
            );
        },
        [companyClientId, missingClient, variant],
    );

    const reject = useCallback(
        async (
            registrationId: string,
            notes: string,
        ): Promise<ReviewResult> => {
            const invalid = missingClient();
            if (invalid) return invalid;
            if (variant === "client") {
                return rejectClientRegistrationAction(registrationId, notes);
            }
            return rejectCompanyRegistrationAction(
                companyClientId!,
                registrationId,
                notes,
            );
        },
        [companyClientId, missingClient, variant],
    );

    const block = useCallback(
        async (
            registrationId: string,
            reason: string,
        ): Promise<ReviewResult> => {
            const invalid = missingClient();
            if (invalid) return invalid;
            if (variant === "client") {
                return blockClientRegistrationAction(registrationId, reason);
            }
            return blockCompanyRegistrationAction(
                companyClientId!,
                registrationId,
                reason,
            );
        },
        [companyClientId, missingClient, variant],
    );

    const unblock = useCallback(
        async (
            registrationId: string,
            reason?: string,
        ): Promise<ReviewResult> => {
            const invalid = missingClient();
            if (invalid) return invalid;
            if (variant === "client") {
                return unblockClientRegistrationAction(registrationId, reason);
            }
            return unblockCompanyRegistrationAction(
                companyClientId!,
                registrationId,
                reason,
            );
        },
        [companyClientId, missingClient, variant],
    );

    return { approve, reject, block, unblock };
}
