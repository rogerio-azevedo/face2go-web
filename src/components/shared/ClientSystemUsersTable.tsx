"use client";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export type ClientSystemUserRow = {
    clientUserId: string;
    userId: string;
    email: string;
    name: string | null;
    role: "client_admin" | "client_operator";
    isActive: boolean;
};

const roleLabels: Record<ClientSystemUserRow["role"], string> = {
    client_admin: "Administrador",
    client_operator: "Operador",
};

export function ClientSystemUsersTable({
    users,
}: {
    users: ClientSystemUserRow[];
}) {
    if (users.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Nenhum usuário do sistema vinculado ainda.
            </p>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((row) => (
                        <TableRow key={row.clientUserId}>
                            <TableCell className="font-medium">
                                {row.name ?? "—"}
                            </TableCell>
                            <TableCell>{row.email}</TableCell>
                            <TableCell>{roleLabels[row.role]}</TableCell>
                            <TableCell>
                                {row.isActive ? (
                                    <Badge>Ativo</Badge>
                                ) : (
                                    <Badge variant="secondary">Inativo</Badge>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
