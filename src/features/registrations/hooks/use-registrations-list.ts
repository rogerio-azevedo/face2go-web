"use client";

import { useEffect } from "react";
import {
    keepPreviousData,
    useQuery,
    type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { listRegistrationsAction } from "@/features/registrations/actions/list";
import type { RegistrationListParams } from "@/lib/pagination";

export type RegistrationsListFilters = {
    variant: "client" | "company";
    companyClientId?: string;
    page: number;
    pageSize: number;
    search?: string;
    blockId?: string;
    unitId?: string;
    room?: string;
    status: NonNullable<RegistrationListParams["status"]>;
};

export function registrationsListRootKey(
    variant: "client" | "company",
    companyClientId?: string,
) {
    return ["registrations-list", variant, companyClientId ?? "self"] as const;
}

export function registrationsListQueryKey(filters: RegistrationsListFilters) {
    return [
        ...registrationsListRootKey(filters.variant, filters.companyClientId),
        filters.page,
        filters.pageSize,
        filters.search ?? "",
        filters.status,
        filters.blockId ?? "",
        filters.unitId ?? "",
        filters.room ?? "",
    ] as const;
}

export function invalidateRegistrationsList(
    queryClient: QueryClient,
    variant: "client" | "company",
    companyClientId?: string,
) {
    return queryClient.invalidateQueries({
        queryKey: registrationsListRootKey(variant, companyClientId),
    });
}

export function useRegistrationsList(filters: RegistrationsListFilters) {
    const query = useQuery({
        queryKey: registrationsListQueryKey(filters),
        queryFn: async () => {
            const result = await listRegistrationsAction(filters.variant, {
                companyClientId: filters.companyClientId,
                page: filters.page,
                pageSize: filters.pageSize,
                search: filters.search,
                blockId: filters.blockId,
                unitId: filters.unitId,
                room: filters.room,
                status: filters.status,
            });
            if (!result.ok) {
                throw new Error(result.error);
            }
            return result.result;
        },
        placeholderData: keepPreviousData,
    });

    useEffect(() => {
        if (!query.isError) return;
        const message =
            query.error instanceof Error
                ? query.error.message
                : "Não foi possível carregar os cadastros.";
        toast.error(message);
    }, [query.isError, query.error, query.errorUpdatedAt]);

    return query;
}
