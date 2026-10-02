"use client";

import { Loader2 } from "lucide-react";

import { RegistrationMobileCard } from "@/features/registrations/components/RegistrationMobileCard";
import type { RegistrationListActionProps } from "@/features/registrations/components/RegistrationsTable";
import type { RegistrationListTab } from "@/features/registrations/lib/registration-format";
import type { ClientRegistrationListRow } from "@/types/domain";

type RegistrationsMobileListProps = {
    rows: ClientRegistrationListRow[];
    tab: RegistrationListTab;
    isFetching: boolean;
    actions: RegistrationListActionProps;
};

export function RegistrationsMobileList({
    rows,
    tab,
    isFetching,
    actions,
}: RegistrationsMobileListProps) {
    return (
        <div className="relative md:hidden">
            {isFetching ? (
                <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center">
                    <Loader2 className="text-muted-foreground size-6 animate-spin" />
                </div>
            ) : null}
            {rows.length === 0 ? (
                <p className="text-muted-foreground py-10 text-center text-sm">
                    Nenhum registro nesta lista.
                </p>
            ) : (
                <div>
                    {rows.map((row) => (
                        <RegistrationMobileCard
                            key={row.id}
                            row={row}
                            tab={tab}
                            actions={actions}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
