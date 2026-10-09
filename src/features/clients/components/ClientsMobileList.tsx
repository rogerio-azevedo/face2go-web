"use client";

import { ClientMobileCard } from "@/features/clients/components/ClientMobileCard";
import type { ClientListRow } from "@/types/domain";

type ClientsMobileListProps = {
    clients: ClientListRow[];
    canManage: boolean;
    showDisplayPanel: boolean;
    pending: boolean;
    onToggleActive: (clientId: string, isActive: boolean) => void;
    onOpenDisplay: (client: ClientListRow) => void;
    onOpenEdit: (client: ClientListRow) => void;
};

export function ClientsMobileList({
    clients,
    canManage,
    showDisplayPanel,
    pending,
    onToggleActive,
    onOpenDisplay,
    onOpenEdit,
}: ClientsMobileListProps) {
    if (clients.length === 0) {
        return (
            <div className="text-muted-foreground rounded-md border py-10 text-center text-sm min-[1440px]:hidden">
                Nenhum cliente cadastrado.
            </div>
        );
    }

    return (
        <div className="grid gap-3 lg:grid-cols-2 min-[1440px]:hidden">
            {clients.map((client) => (
                <ClientMobileCard
                    key={client.id}
                    client={client}
                    canManage={canManage}
                    showDisplayPanel={showDisplayPanel}
                    pending={pending}
                    onToggleActive={onToggleActive}
                    onOpenDisplay={onOpenDisplay}
                    onOpenEdit={onOpenEdit}
                />
            ))}
        </div>
    );
}
