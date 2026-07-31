"use client";

import { useCallback, useState } from "react";

import type { PersonLookupResult } from "@/lib/types/person-lookup";
import { normalizeCpf } from "@/lib/utils/document";

type LookupAction = (
    clientId: string,
    params: { cpf?: string; email?: string },
) => Promise<
    | { success: true; result: PersonLookupResult }
    | { error: string }
>;

export function usePersonLookup(clientId: string, lookupAction: LookupAction) {
    const [lookupResult, setLookupResult] = useState<PersonLookupResult | null>(
        null,
    );
    const [checking, setChecking] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);

    const resetLookup = useCallback(() => {
        setLookupResult(null);
        setLookupError(null);
    }, []);

    const runLookup = useCallback(
        async (cpf?: string, email?: string) => {
            const normalizedCpf = cpf ? normalizeCpf(cpf) : "";
            const trimmedEmail = email?.trim();
            if (normalizedCpf.length !== 11 && !trimmedEmail) {
                resetLookup();
                return null;
            }

            setChecking(true);
            setLookupError(null);
            try {
                const response = await lookupAction(clientId, {
                    cpf:
                        normalizedCpf.length === 11 ? normalizedCpf : undefined,
                    email: trimmedEmail || undefined,
                });
                if ("error" in response) {
                    setLookupError(response.error);
                    setLookupResult(null);
                    return null;
                }
                setLookupResult(response.result);
                return response.result;
            } finally {
                setChecking(false);
            }
        },
        [clientId, lookupAction, resetLookup],
    );

    const requirePassword =
        !lookupResult?.matched ||
        (lookupResult.matched && !lookupResult.hasLogin);

    const submitBlocked = Boolean(lookupResult?.conflict);

    return {
        lookupResult,
        checking,
        lookupError,
        runLookup,
        resetLookup,
        requirePassword,
        submitBlocked,
    };
}
