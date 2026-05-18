'use client';

import { MonitorPlay } from 'lucide-react';
import { useState } from 'react';

import type { ClientListRow } from '@/types/domain';
import { ClientTvDisplaySheet } from '@/components/company/clientes/ClientTvDisplaySheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    CLIENT_TYPE_LABELS,
    type ClientType,
} from '@/lib/validations/clients';

export function CompanyDisplayTable({
    clients,
}: {
    clients: ClientListRow[];
}) {
    const [tvClient, setTvClient] = useState<ClientListRow | null>(null);

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Unidade escola</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Display TV</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="text-muted-foreground py-10 text-center"
                                >
                                    Nenhum cliente cadastrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {row.name}
                                            {row.isActive ? (
                                                <Badge>Ativo</Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Inativo
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {CLIENT_TYPE_LABELS[
                                            row.type as ClientType
                                        ] ?? row.type}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5"
                                            onClick={() => setTvClient(row)}
                                        >
                                            <MonitorPlay
                                                className="size-4 shrink-0"
                                                aria-hidden
                                            />
                                            Abrir URL
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ClientTvDisplaySheet
                client={
                    tvClient
                        ? { id: tvClient.id, name: tvClient.name }
                        : null
                }
                open={tvClient !== null}
                onOpenChange={(o) => {
                    if (!o) setTvClient(null);
                }}
            />
        </>
    );
}
