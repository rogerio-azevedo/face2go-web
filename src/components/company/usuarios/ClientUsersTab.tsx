"use client";

import { useState, useTransition } from "react";

import {
    fetchClientSystemUsersAction,
    type ClientSystemUserRow,
} from "@/app/company/clientes/[clientId]/usuarios/client-system-actions";
import { CompanyClientInvitePanel } from "@/components/company/clientes/CompanyClientInvitePanel";
import { ClientSystemUsersTable } from "@/components/shared/ClientSystemUsersTable";
import { Label } from "@/components/ui/label";

type ClientOption = {
    id: string;
    name: string;
};

export function ClientUsersTab({ clients }: { clients: ClientOption[] }) {
    const [selectedClientId, setSelectedClientId] = useState("");
    const [users, setUsers] = useState<ClientSystemUserRow[]>([]);
    const [loadingUsers, startLoadUsers] = useTransition();

    function loadUsers(clientId: string) {
        if (!clientId) {
            setUsers([]);
            return;
        }

        startLoadUsers(async () => {
            const result = await fetchClientSystemUsersAction(clientId);
            setUsers(result.users);
        });
    }

    function handleClientChange(clientId: string) {
        setSelectedClientId(clientId);
        loadUsers(clientId);
    }

    if (clients.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Nenhum cliente cadastrado.
            </p>
        );
    }

    const selectedClient = clients.find((c) => c.id === selectedClientId);

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="client-select">Cliente</Label>
                <select
                    id="client-select"
                    className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    value={selectedClientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                >
                    <option value="">Selecione um cliente</option>
                    {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.name}
                        </option>
                    ))}
                </select>
            </div>

            {!selectedClientId ? (
                <p className="text-sm text-muted-foreground">
                    Selecione um cliente para gerenciar convites e usuários do
                    sistema.
                </p>
            ) : (
                <div className="space-y-6">
                    <section className="space-y-3">
                        <div className="space-y-1">
                            <h2 className="text-sm font-medium">Convites</h2>
                            <p className="text-sm text-muted-foreground">
                                Links para administradores e operadores de{" "}
                                <span className="font-medium text-foreground">
                                    {selectedClient?.name}
                                </span>
                                .
                            </p>
                        </div>
                        <CompanyClientInvitePanel
                            clientId={selectedClientId}
                            onInviteGenerated={() =>
                                loadUsers(selectedClientId)
                            }
                        />
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-sm font-medium">
                            Usuários vinculados
                        </h2>
                        {loadingUsers ? (
                            <p className="text-sm text-muted-foreground">
                                Carregando usuários...
                            </p>
                        ) : (
                            <ClientSystemUsersTable users={users} />
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}
