"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    resolveEmergencyAction,
    updateEmergencyCheckinAction,
} from "@/features/presence/actions/presence-emergency";
import { useEmergencySocket } from "@/hooks/use-emergency-socket";
import { cn } from "@/lib/utils";
import type {
    EmergencyCheckinItem,
    EmergencyCheckinStatus,
    EmergencyEventResponse,
} from "@/types/domain";

const STATUS_LABELS: Record<EmergencyCheckinStatus, string> = {
    pending: "Pendente",
    safe: "Seguro",
    not_located: "Não localizado",
    evacuated: "Evacuado",
    injured: "Ferido",
};

const STATUS_VARIANT: Record<
    EmergencyCheckinStatus,
    "default" | "secondary" | "destructive" | "outline"
> = {
    pending: "outline",
    safe: "default",
    not_located: "destructive",
    evacuated: "secondary",
    injured: "destructive",
};

type EmergencyWorkspaceProps = {
    initialEvent: EmergencyEventResponse;
    canManage: boolean;
};

export function EmergencyWorkspace({
    initialEvent,
    canManage,
}: EmergencyWorkspaceProps) {
    const { data: session } = useSession();
    const token = session?.accessToken as string | undefined;
    const { connected, event } = useEmergencySocket(
        token,
        initialEvent.id,
        initialEvent,
    );
    const [search, setSearch] = useState("");
    const [pending, startTransition] = useTransition();

    const filteredCheckins = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return event.checkins;
        return event.checkins.filter((item) =>
            item.personName.toLowerCase().includes(term),
        );
    }, [event.checkins, search]);

    const grouped = useMemo(() => {
        const groups = new Map<string, EmergencyCheckinItem[]>();
        for (const item of filteredCheckins) {
            const key =
                item.personType === "student"
                    ? (item.className ?? "Sem turma")
                    : item.personType === "responsible"
                      ? "Responsáveis"
                      : item.personType === "member"
                        ? "Membros"
                        : "Outros";
            const list = groups.get(key) ?? [];
            list.push(item);
            groups.set(key, list);
        }
        return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [filteredCheckins]);

    const updateStatus = (checkinId: string, status: EmergencyCheckinStatus) => {
        startTransition(async () => {
            const result = await updateEmergencyCheckinAction(
                event.id,
                checkinId,
                { status },
            );
            if (!result.ok) {
                toast.error(result.error);
            }
        });
    };

    const handleResolve = () => {
        startTransition(async () => {
            const result = await resolveEmergencyAction(event.id);
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            toast.success("Emergência encerrada.");
        });
    };

    const exportCsv = () => {
        const header = [
            "Nome",
            "Tipo",
            "Turma",
            "Status",
            "Esperado",
            "Atualizado em",
        ];
        const rows = event.checkins.map((item) => [
            item.personName,
            item.personType,
            item.className ?? "",
            STATUS_LABELS[item.status],
            item.expectedStatus,
            item.statusUpdatedAt ?? "",
        ]);
        const csv = [header, ...rows]
            .map((row) => row.map((cell) => `"${cell}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `emergencia-${event.clientName}-${event.startedAt}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={
                    <span className="flex flex-wrap items-center gap-2">
                        Emergência — {event.clientName}
                        <Badge
                            variant={
                                event.status === "active"
                                    ? "destructive"
                                    : "secondary"
                            }
                        >
                            {event.status === "active" ? "Ativa" : "Encerrada"}
                        </Badge>
                        <Badge variant={connected ? "default" : "outline"}>
                            {connected ? "Tempo real" : "Offline"}
                        </Badge>
                    </span>
                }
                description={
                    <>
                        Iniciada em{" "}
                        {new Date(event.startedAt).toLocaleString("pt-BR")}
                        {event.srpAction ? ` · SRP: ${event.srpAction}` : ""}
                    </>
                }
                actions={
                    <>
                        <Link
                            href={`/company/presenca?clientId=${event.clientId}`}
                            className={cn(buttonVariants({ variant: "outline" }))}
                        >
                            Voltar à presença
                        </Link>
                        <Button variant="outline" onClick={exportCsv}>
                            Exportar CSV
                        </Button>
                        {canManage && event.status === "active" && (
                            <Button
                                variant="destructive"
                                disabled={pending}
                                onClick={handleResolve}
                            >
                                Encerrar emergência
                            </Button>
                        )}
                    </>
                }
            />

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <li className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Esperados</p>
                    <p className="text-2xl font-semibold">{event.summary.total}</p>
                </li>
                <li className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-semibold">{event.summary.pending}</p>
                </li>
                <li className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Seguros</p>
                    <p className="text-2xl font-semibold text-emerald-600">
                        {event.summary.safe}
                    </p>
                </li>
                <li className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Não localizados</p>
                    <p className="text-2xl font-semibold text-red-600">
                        {event.summary.notLocated}
                    </p>
                </li>
                <li className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Evacuados</p>
                    <p className="text-2xl font-semibold">{event.summary.evacuated}</p>
                </li>
                <li className="rounded-lg border bg-card p-4">
                    <p className="text-sm text-muted-foreground">Feridos</p>
                    <p className="text-2xl font-semibold text-amber-600">
                        {event.summary.injured}
                    </p>
                </li>
            </ul>

            <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome..."
                className="max-w-sm"
            />

            {grouped.map(([groupName, items]) => (
                <div key={groupName} className="rounded-xl border bg-card">
                    <div className="border-b px-4 py-3 font-medium">
                        {groupName}{" "}
                        <span className="text-muted-foreground">({items.length})</span>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Status</TableHead>
                                {canManage && event.status === "active" && (
                                    <TableHead className="text-right">Ações</TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.personName}</TableCell>
                                    <TableCell>
                                        <Badge variant={STATUS_VARIANT[item.status]}>
                                            {STATUS_LABELS[item.status]}
                                        </Badge>
                                    </TableCell>
                                    {canManage && event.status === "active" && (
                                        <TableCell className="text-right">
                                            <div className="flex flex-wrap justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={pending}
                                                    onClick={() =>
                                                        updateStatus(item.id, "safe")
                                                    }
                                                >
                                                    Seguro
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={pending}
                                                    onClick={() =>
                                                        updateStatus(
                                                            item.id,
                                                            "not_located",
                                                        )
                                                    }
                                                >
                                                    Não localizado
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={pending}
                                                    onClick={() =>
                                                        updateStatus(
                                                            item.id,
                                                            "evacuated",
                                                        )
                                                    }
                                                >
                                                    Evacuado
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={pending}
                                                    onClick={() =>
                                                        updateStatus(item.id, "injured")
                                                    }
                                                >
                                                    Ferido
                                                </Button>
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ))}
        </div>
    );
}
