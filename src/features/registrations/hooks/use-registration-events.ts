"use client";

import { useQuery } from "@tanstack/react-query";

import { listRegistrationEventsAction } from "@/features/registrations/actions/events";

export function registrationEventsQueryKey(
    variant: "client" | "company",
    companyClientId: string | undefined,
    registrationId: string,
) {
    return [
        "registration-events",
        variant,
        companyClientId ?? null,
        registrationId,
    ] as const;
}

export function useRegistrationEvents({
    variant,
    companyClientId,
    registrationId,
    enabled,
}: {
    variant: "client" | "company";
    companyClientId?: string;
    registrationId: string | null;
    enabled: boolean;
}) {
    return useQuery({
        queryKey: registrationEventsQueryKey(
            variant,
            companyClientId,
            registrationId ?? "",
        ),
        enabled: enabled && registrationId != null,
        queryFn: async () => {
            const result = await listRegistrationEventsAction(
                variant,
                registrationId ?? "",
                companyClientId,
            );
            if (!result.ok) throw new Error(result.error);
            return result.events;
        },
    });
}
