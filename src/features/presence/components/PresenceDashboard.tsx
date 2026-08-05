"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
    AlertTriangle,
    GraduationCap,
    ShieldAlert,
    Users,
    UserSquare2,
} from "lucide-react";
import { toast } from "sonner";

import { DashboardStatsCard } from "@/components/shared/DashboardStatsCard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { activateEmergencyAction } from "@/features/presence/actions/presence-emergency";
import { SchoolFilterSelect } from "@/features/presence/components/SchoolFilterSelect";
import { cn } from "@/lib/utils";
import type {
    ClientListRow,
    CompanyPresenceResponse,
    PresencePersonItem,
    SchoolPresenceResponse,
} from "@/types/domain";

type PresenceDashboardProps = {
    clients: ClientListRow[];
    selectedClientId: string;
    companyId: string;
    companyPresence: CompanyPresenceResponse | null;
    schoolPresence: SchoolPresenceResponse | null;
    canManageEmergency: boolean;
    loadError?: string | null;
};

const EMPTY_COUNTS = {
    students: 0,
    responsibles: 0,
    members: 0,
    guests: 0,
    total: 0,
};

function formatTime(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function personTypeLabel(type: PresencePersonItem["personType"]): string {
    switch (type) {
        case "student":
            return "Aluno";
        case "responsible":
            return "Responsável";
        case "member":
            return "Membro";
        default:
            return "Visitante";
    }
}

export function PresenceDashboard({
    clients,
    selectedClientId,
    companyId,
    companyPresence,
    schoolPresence,
    canManageEmergency,
    loadError,
}: PresenceDashboardProps) {
    const [search, setSearch] = useState("");
    const [pending, startTransition] = useTransition();

    const selectedSchool = clients.find((c) => c.id === selectedClientId);
    const counts = schoolPresence?.counts ?? companyPresence?.totals ?? EMPTY_COUNTS;
    const isSchoolView = selectedClientId !== "all";
    const allSchoolsSummary =
        companyPresence?.schools ??
        clients
            .filter((client) => client.type === "school" && client.isActive)
            .map((client) => ({
                clientId: client.id,
                clientName: client.name,
                counts: EMPTY_COUNTS,
                activeEmergencyId: null,
            }));

    const filteredPeople = useMemo(() => {
        const people = schoolPresence?.people ?? [];
        const term = search.trim().toLowerCase();
        if (!term) return people;
        return people.filter((person) =>
            person.personName.toLowerCase().includes(term),
        );
    }, [schoolPresence?.people, search]);

    const groupedByClass = useMemo(() => {
        const groups = new Map<string, PresencePersonItem[]>();
        for (const person of filteredPeople) {
            const key =
                person.personType === "student"
                    ? (person.className ?? "Sem turma")
                    : personTypeLabel(person.personType);
            const list = groups.get(key) ?? [];
            list.push(person);
            groups.set(key, list);
        }
        return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
    }, [filteredPeople]);

    const handleActivateEmergency = () => {
        if (!schoolPresence) return;
        startTransition(async () => {
            const result = await activateEmergencyAction(schoolPresence.clientId, {
                srpAction: "evacuate",
            });
            if (!result.ok) {
                toast.error(result.error);
                return;
            }
            toast.success("Modo emergência ativado.");
            window.location.href = `/company/emergencia/${result.data.id}`;
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <SchoolFilterSelect clients={clients} value={selectedClientId} />
                {schoolPresence && canManageEmergency && (
                    <div className="flex flex-wrap gap-2">
                        {schoolPresence.activeEmergencyId ? (
                            <Link
                                href={`/company/emergencia/${schoolPresence.activeEmergencyId}`}
                                className={cn(
                                    buttonVariants({ variant: "destructive" }),
                                    "inline-flex gap-2",
                                )}
                            >
                                <ShieldAlert className="size-4" />
                                Emergência ativa
                            </Link>
                        ) : (
                            <Button
                                variant="destructive"
                                disabled={pending}
                                onClick={handleActivateEmergency}
                            >
                                <ShieldAlert className="size-4" />
                                Ativar modo emergência
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {loadError && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <div>
                            <p className="font-medium">
                                Não foi possível carregar os dados de presença.
                            </p>
                            <p className="mt-1">{loadError}</p>
                            <p className="mt-2 text-red-800">
                                Se acabou de atualizar o sistema, execute{" "}
                                <code className="rounded bg-red-100 px-1">
                                    pnpm db:migrate
                                </code>{" "}
                                no projeto{" "}
                                <strong>face2go-server</strong> e reinicie a API.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {schoolPresence && !schoolPresence.deviceSummary.hasDirectionConfigured && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <p>
                            Configure o sentido (<strong>entrada/saída</strong>) nos
                            leitores faciais e câmeras LPR desta escola para a
                            contagem automática funcionar corretamente.
                        </p>
                    </div>
                </div>
            )}

            {isSchoolView && !loadError && (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <li>
                        <DashboardStatsCard
                            title="Alunos dentro"
                            value={counts.students}
                            description="Contagem automática via leitores/LPR."
                            icon={GraduationCap}
                            iconClassName="bg-sky-600"
                        />
                    </li>
                    <li>
                        <DashboardStatsCard
                            title="Responsáveis dentro"
                            value={counts.responsibles}
                            description="Pais, avós e responsáveis na escola."
                            icon={Users}
                            iconClassName="bg-violet-600"
                        />
                    </li>
                    <li>
                        <DashboardStatsCard
                            title="Membros dentro"
                            value={counts.members}
                            description="Equipe e colaboradores presentes."
                            icon={UserSquare2}
                            iconClassName="bg-teal-600"
                        />
                    </li>
                    <li>
                        <DashboardStatsCard
                            title="Total dentro"
                            value={counts.total}
                            description="Soma de todas as pessoas rastreadas."
                            icon={ShieldAlert}
                            iconClassName="bg-red-600"
                        />
                    </li>
                </ul>
            )}

            {selectedClientId === "all" && counts && (
                <div className="rounded-xl border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Escola</TableHead>
                                <TableHead>Alunos</TableHead>
                                <TableHead>Responsáveis</TableHead>
                                <TableHead>Membros</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allSchoolsSummary.map((school) => (
                                <TableRow key={school.clientId}>
                                    <TableCell className="font-medium">
                                        {school.clientName}
                                        {school.activeEmergencyId && (
                                            <Badge
                                                variant="destructive"
                                                className="ml-2"
                                            >
                                                Emergência
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{school.counts.students}</TableCell>
                                    <TableCell>{school.counts.responsibles}</TableCell>
                                    <TableCell>{school.counts.members}</TableCell>
                                    <TableCell>{school.counts.total}</TableCell>
                                    <TableCell className="text-right">
                                        <Link
                                            href={`/company/presenca?clientId=${school.clientId}`}
                                            className={cn(
                                                buttonVariants({
                                                    variant: "outline",
                                                    size: "sm",
                                                }),
                                            )}
                                        >
                                            Ver detalhes
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {isSchoolView && !schoolPresence && !loadError && (
                <p className="text-sm text-muted-foreground">
                    Carregando presença de{" "}
                    {selectedSchool?.name ?? "escola selecionada"}...
                </p>
            )}

            {schoolPresence && (
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                {schoolPresence.clientName}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Pessoas com status &quot;dentro&quot; nesta escola.
                            </p>
                        </div>
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar por nome..."
                            className="max-w-sm"
                        />
                    </div>

                    {groupedByClass.map(([groupName, people]) => (
                        <div key={groupName} className="rounded-xl border bg-card">
                            <div className="border-b px-4 py-3 font-medium">
                                {groupName}{" "}
                                <span className="text-muted-foreground">
                                    ({people.length})
                                </span>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Entrada</TableHead>
                                        <TableHead>Origem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {people.map((person) => (
                                        <TableRow key={person.personId}>
                                            <TableCell>{person.personName}</TableCell>
                                            <TableCell>
                                                {personTypeLabel(person.personType)}
                                            </TableCell>
                                            <TableCell>
                                                {formatTime(person.lastEventAt)}
                                            </TableCell>
                                            <TableCell>
                                                {person.lastDeviceName ?? "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ))}

                    {filteredPeople.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            Nenhuma pessoa com status &quot;dentro&quot; no momento.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
