"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deferInEffect } from "@/lib/defer-in-effect";

import {
    bindLocationGroupsAction,
    ensureLocationUnitAction,
    getClientLocationReviewAction,
} from "../actions";
import type {
    CatalogBlock,
    ClientLocationReview,
    LocationReviewGroup,
    LocationReviewPerson,
} from "../types";
import { BlockUnitSelects } from "./BlockUnitSelects";

const PAGE_SIZE = 50;

function blockIdOfUnit(catalog: CatalogBlock[], unitId: string) {
    return (
        catalog.find((block) => block.units.some((unit) => unit.id === unitId))
            ?.id ?? ""
    );
}

function withSuggestions(
    groups: LocationReviewGroup[],
    current: Record<string, string>,
) {
    const next = { ...current };
    for (const group of groups) {
        if (!next[group.key] && group.suggestion) {
            next[group.key] = group.suggestion.unitId;
        }
    }
    return next;
}

export function ClientLocationReviewPanel({ clientId }: { clientId: string }) {
    const [review, setReview] = useState<ClientLocationReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [choices, setChoices] = useState<Record<string, string>>({});
    const [ignored, setIgnored] = useState<Set<string>>(new Set());
    const [showIgnored, setShowIgnored] = useState(false);
    const [search, setSearch] = useState("");
    const [visible, setVisible] = useState(PAGE_SIZE);

    async function load() {
        const result = await getClientLocationReviewAction(clientId);
        if ("error" in result) {
            toast.error(result.error);
            return null;
        }
        setReview(result.review);
        setChoices((current) => withSuggestions(result.review.groups, current));
        return result.review;
    }

    useEffect(() => {
        deferInEffect(() => {
            void (async () => {
                setLoading(true);
                const result = await getClientLocationReviewAction(clientId);
                if ("error" in result) toast.error(result.error);
                else {
                    setReview(result.review);
                    setChoices((current) =>
                        withSuggestions(result.review.groups, current),
                    );
                }
                setLoading(false);
            })();
        });
    }, [clientId]);

    const catalog = useMemo(() => review?.catalog ?? [], [review]);
    const term = search.trim().toLowerCase();
    const groups = useMemo(
        () =>
            (review?.groups ?? []).filter((group) => {
                if (ignored.has(group.key) !== showIgnored) return false;
                if (!term) return true;
                return `${group.blockText} ${group.unitText}`
                    .toLowerCase()
                    .includes(term);
            }),
        [review, ignored, showIgnored, term],
    );
    const resolved = (review?.groups ?? []).filter(
        (group) => !ignored.has(group.key) && choices[group.key],
    );

    async function bind(items: LocationReviewGroup[]) {
        setBusy(true);
        try {
            const result = await bindLocationGroupsAction(
                clientId,
                items.map((group) => ({
                    blockText: group.blockText,
                    unitText: group.unitText,
                    unitId: choices[group.key],
                })),
            );
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            toast.success(
                `${result.registrations} cadastro(s) e ${result.members} membro(s) vinculados.`,
            );
            await load();
        } finally {
            setBusy(false);
        }
    }

    async function createAndSelect(
        group: LocationReviewGroup,
        input: { blockName: string; unitName: string },
    ) {
        setBusy(true);
        try {
            const result = await ensureLocationUnitAction(clientId, input);
            if ("error" in result) {
                toast.error(result.error);
                return;
            }
            setChoices((current) => ({ ...current, [group.key]: result.unitId }));
            await load();
        } finally {
            setBusy(false);
        }
    }

    function toggleIgnored(key: string) {
        setIgnored((current) => {
            const next = new Set(current);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }

    if (loading) {
        return (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Carregando…
            </p>
        );
    }
    if (!review) {
        return (
            <p className="text-muted-foreground text-sm">
                Não foi possível carregar este condomínio.
            </p>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={`${review.client.name} — Blocos e unidades`}
                description="Escolha a unidade do catálogo para cada texto antigo e vincule. Quem já tem unidade não muda."
            />

            <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">
                    {review.summary.linked} vinculados
                </Badge>
                <Badge variant="outline">{review.summary.textOnly} só texto</Badge>
                <Badge variant="outline">
                    {review.summary.noLocation} sem localização
                </Badge>
                <Link
                    href="/company/blocos-unidades"
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                    Voltar
                </Link>
                <Link
                    href={`/company/clientes/${clientId}/usuarios`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                    Abrir cliente
                </Link>
            </div>

            {catalog.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    Este condomínio ainda não tem blocos ativos. Crie no grupo
                    abaixo com &quot;Criar no catálogo&quot; ou na aba Blocos e
                    unidades do cliente.
                </p>
            ) : null}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setVisible(PAGE_SIZE);
                    }}
                    placeholder="Buscar bloco ou unidade"
                    className="sm:max-w-xs"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setShowIgnored((value) => !value);
                        setVisible(PAGE_SIZE);
                    }}
                >
                    {showIgnored
                        ? "Ver pendentes"
                        : `Ver ignorados (${ignored.size})`}
                </Button>
                <Button
                    type="button"
                    className="sm:ml-auto"
                    disabled={busy || resolved.length === 0}
                    onClick={() => void bind(resolved)}
                >
                    Vincular {resolved.length} grupo(s) com unidade escolhida
                </Button>
            </div>

            {groups.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    {showIgnored
                        ? "Nenhum grupo ignorado."
                        : "Nenhum texto pendente de vínculo."}
                </p>
            ) : (
                <div className="space-y-3">
                    {groups.slice(0, visible).map((group, index) => (
                        <GroupCard
                            key={group.key}
                            idPrefix={`group-${index}`}
                            group={group}
                            catalog={catalog}
                            unitId={choices[group.key] ?? ""}
                            onUnitIdChange={(unitId) =>
                                setChoices((current) => ({
                                    ...current,
                                    [group.key]: unitId,
                                }))
                            }
                            ignored={ignored.has(group.key)}
                            busy={busy}
                            onBind={() => void bind([group])}
                            onCreate={(input) =>
                                void createAndSelect(group, input)
                            }
                            onToggleIgnored={() => toggleIgnored(group.key)}
                        />
                    ))}
                    {groups.length > visible ? (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setVisible((value) => value + PAGE_SIZE)}
                        >
                            Mostrar mais ({groups.length - visible})
                        </Button>
                    ) : null}
                </div>
            )}

            {review.noLocation.registrations + review.noLocation.members > 0 ? (
                <section className="space-y-2 rounded-lg border p-4">
                    <h2 className="font-semibold">Sem localização</h2>
                    <p className="text-muted-foreground text-sm">
                        {review.noLocation.registrations} cadastro(s) e{" "}
                        {review.noLocation.members} membro(s) sem bloco e sem
                        unidade. Ajuste um a um no cadastro do cliente.
                    </p>
                    <PeopleList
                        people={review.noLocation.people}
                        total={
                            review.noLocation.registrations +
                            review.noLocation.members
                        }
                    />
                </section>
            ) : null}
        </div>
    );
}

function GroupCard({
    idPrefix,
    group,
    catalog,
    unitId,
    onUnitIdChange,
    ignored,
    busy,
    onBind,
    onCreate,
    onToggleIgnored,
}: {
    idPrefix: string;
    group: LocationReviewGroup;
    catalog: CatalogBlock[];
    unitId: string;
    onUnitIdChange: (unitId: string) => void;
    ignored: boolean;
    busy: boolean;
    onBind: () => void;
    onCreate: (input: { blockName: string; unitName: string }) => void;
    onToggleIgnored: () => void;
}) {
    const [pickedBlockId, setPickedBlockId] = useState("");
    const [creating, setCreating] = useState(false);
    const [blockName, setBlockName] = useState(group.blockText);
    const [unitName, setUnitName] = useState(group.unitText);
    const [showPeople, setShowPeople] = useState(false);

    const blockId = unitId ? blockIdOfUnit(catalog, unitId) : pickedBlockId;
    const suggested = group.suggestion && group.suggestion.unitId === unitId;
    const total = group.registrations + group.members;

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                    Bloco: {group.blockText || "—"} · Unidade:{" "}
                    {group.unitText || "—"}
                </span>
                <Badge variant="secondary">
                    {group.registrations} cadastro(s) · {group.members} membro(s)
                </Badge>
                {suggested ? (
                    <Badge variant="outline">
                        {group.suggestion?.exact
                            ? "Sugestão exata"
                            : "Sugestão aproximada, confira"}
                    </Badge>
                ) : null}
            </div>

            <BlockUnitSelects
                blocks={catalog}
                blockId={blockId}
                unitId={unitId}
                onBlockIdChange={setPickedBlockId}
                onUnitIdChange={onUnitIdChange}
                idPrefix={idPrefix}
                plainLabels
                emptyHint="Sem blocos ativos. Use “Criar no catálogo”."
            />

            {creating ? (
                <form
                    className="flex flex-col gap-2 sm:flex-row"
                    onSubmit={(event) => {
                        event.preventDefault();
                        onCreate({ blockName, unitName });
                        setCreating(false);
                    }}
                >
                    <Input
                        value={blockName}
                        onChange={(event) => setBlockName(event.target.value)}
                        placeholder="Bloco"
                        disabled={busy}
                    />
                    <Input
                        value={unitName}
                        onChange={(event) => setUnitName(event.target.value)}
                        placeholder="Unidade"
                        disabled={busy}
                    />
                    <Button
                        type="submit"
                        variant="outline"
                        disabled={busy || !blockName.trim() || !unitName.trim()}
                    >
                        Criar e selecionar
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCreating(false)}
                    >
                        Cancelar
                    </Button>
                </form>
            ) : null}

            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    size="sm"
                    disabled={busy || !unitId || ignored}
                    onClick={onBind}
                >
                    Vincular {total}
                </Button>
                {!creating ? (
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => setCreating(true)}
                    >
                        Criar no catálogo
                    </Button>
                ) : null}
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={onToggleIgnored}
                >
                    {ignored ? "Voltar para pendentes" : "Ignorar"}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPeople((value) => !value)}
                >
                    {showPeople ? "Ocultar pessoas" : "Ver pessoas"}
                </Button>
            </div>

            {showPeople ? <PeopleList people={group.people} total={total} /> : null}
        </div>
    );
}

function PeopleList({
    people,
    total,
}: {
    people: LocationReviewPerson[];
    total?: number;
}) {
    return (
        <ul className="text-muted-foreground space-y-1 text-sm">
            {people.map((person) => (
                <li key={`${person.kind}-${person.id}`}>
                    {person.name ?? "Sem nome"}
                    {" · "}
                    {person.kind === "registration" ? "Cadastro" : "Membro"}
                    {person.faceId != null ? ` · ID ${person.faceId}` : ""}
                </li>
            ))}
            {total != null && total > people.length ? (
                <li>e mais {total - people.length}…</li>
            ) : null}
        </ul>
    );
}
