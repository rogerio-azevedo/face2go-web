'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { SimulatablePerson } from './actions';
import {
    listSimulatablePeopleAction,
    simulateFaceAccessAction,
} from './actions';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type SimulateClientOption = {
    id: string;
    name: string;
};

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    const a = parts[0]!;
    const b = parts[parts.length - 1]!;
    return `${a[0] ?? '?'}${b[0] ?? '?'}`.toUpperCase();
}

function filterPeople(list: SimulatablePerson[], q: string): SimulatablePerson[] {
    const s = q.trim().toLowerCase();
    if (!s) return list;
    return list.filter((p) => p.name.toLowerCase().includes(s));
}

type PersonSimRowProps = {
    person: SimulatablePerson;
    busy: boolean;
    onSimulate: () => void;
};

function PersonSimRow({ person, busy, onSimulate }: PersonSimRowProps) {
    return (
        <Card size="sm">
            <CardContent className="flex flex-row flex-wrap items-center gap-4 py-3">
                <Avatar size="lg" className="size-12">
                    {person.photoUrl ? (
                        <>
                            <AvatarImage
                                src={person.photoUrl}
                                alt=""
                                className="size-full object-cover"
                            />
                            <AvatarFallback>{initials(person.name)}</AvatarFallback>
                        </>
                    ) : (
                        <AvatarFallback>{initials(person.name)}</AvatarFallback>
                    )}
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate font-medium">{person.name}</p>
                    {!person.hasFace ? (
                        <Badge variant="outline" className="text-muted-foreground">
                            Sem face cadastrada
                        </Badge>
                    ) : null}
                </div>
                <Button size="sm" disabled={!person.hasFace || busy} onClick={onSimulate}>
                    {busy ? (
                        <>
                            <Loader2 className="animate-spin" />
                            Simulando…
                        </>
                    ) : (
                        'Simular acesso'
                    )}
                </Button>
            </CardContent>
        </Card>
    );
}

export function SimulateAccessTool({
    clients,
}: {
    clients: SimulateClientOption[];
}) {
    const [clientId, setClientId] = useState(clients[0]?.id ?? '');
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<SimulatablePerson[]>([]);
    const [responsibles, setResponsibles] = useState<SimulatablePerson[]>([]);
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [simulatingId, setSimulatingId] = useState<string | null>(null);
    const [tab, setTab] = useState('students');

    const loadPeople = useCallback(async (cid: string) => {
        if (!cid) {
            setStudents([]);
            setResponsibles([]);
            return;
        }
        setLoadingList(true);
        setListError(null);
        const res = await listSimulatablePeopleAction(cid);
        setLoadingList(false);
        if (!('success' in res) || !res.success) {
            setListError(res && 'error' in res ? res.error : 'Erro ao carregar.');
            setStudents([]);
            setResponsibles([]);
            return;
        }
        setStudents(res.students);
        setResponsibles(res.responsibles);
    }, []);

    useEffect(() => {
        void loadPeople(clientId);
    }, [clientId, loadPeople]);

    const filteredStudents = useMemo(
        () => filterPeople(students, search),
        [students, search],
    );

    const filteredResponsibles = useMemo(
        () => filterPeople(responsibles, search),
        [responsibles, search],
    );

    async function runSimulate(
        pid: string,
        type: 'student' | 'responsible',
        name: string,
    ) {
        if (!clientId) {
            toast.error('Selecione um cliente.');
            return;
        }

        setSimulatingId(pid);
        try {
            const out = await simulateFaceAccessAction({
                clientId,
                personId: pid,
                personType: type,
            });
            if ('error' in out) {
                toast.error(out.error);
                return;
            }
            toast.success(`Acesso simulado para ${name}.`, {
                description: `accessId: ${out.accessId}`,
            });
        } finally {
            setSimulatingId(null);
        }
    }

    if (clients.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Nenhuma escola</CardTitle>
                    <CardDescription>
                        Cadastre um cliente primeiro para usar o simulador.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Cliente</CardTitle>
                    <CardDescription>
                        Escola cujo fluxo de acesso (Mongo, push, TV) será disparado.
                    </CardDescription>
                </CardHeader>
                <CardContent className="max-w-md">
                    <label className="text-muted-foreground mb-2 block text-sm">
                        Escola
                    </label>
                    <select
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 h-8 w-full rounded-lg border px-2.5 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50"
                    >
                        {clients.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </CardContent>
            </Card>

            <div className="space-y-2">
                <label className="text-muted-foreground text-sm" htmlFor="sim-search">
                    Buscar por nome
                </label>
                <Input
                    id="sim-search"
                    placeholder="Nome…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {listError ? (
                <p className="text-destructive text-sm">{listError}</p>
            ) : null}

            {loadingList ? (
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : (
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList>
                        <TabsTrigger value="students">
                            Alunos ({filteredStudents.length})
                        </TabsTrigger>
                        <TabsTrigger value="responsibles">
                            Responsáveis ({filteredResponsibles.length})
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="students" className="mt-4 space-y-3">
                        {filteredStudents.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                Nenhum aluno encontrado.
                            </p>
                        ) : (
                            filteredStudents.map((p) => (
                                <PersonSimRow
                                    key={p.id}
                                    person={p}
                                    busy={simulatingId === p.id}
                                    onSimulate={() =>
                                        runSimulate(p.id, 'student', p.name)
                                    }
                                />
                            ))
                        )}
                    </TabsContent>
                    <TabsContent value="responsibles" className="mt-4 space-y-3">
                        {filteredResponsibles.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                Nenhum responsável encontrado.
                            </p>
                        ) : (
                            filteredResponsibles.map((p) => (
                                <PersonSimRow
                                    key={p.id}
                                    person={p}
                                    busy={simulatingId === p.id}
                                    onSimulate={() =>
                                        runSimulate(p.id, 'responsible', p.name)
                                    }
                                />
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
