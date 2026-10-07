"use client";

import { useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type {
    CatalogBlock,
    LocationReviewPerson,
    LocationReviewSuggestion,
} from "../types";
import { BlockUnitSelects } from "./BlockUnitSelects";

function blockIdOfUnit(catalog: CatalogBlock[], unitId: string) {
    return (
        catalog.find((block) => block.units.some((unit) => unit.id === unitId))
            ?.id ?? ""
    );
}

export type LocationGroupCardData = {
    registrations: number;
    members: number;
    people: LocationReviewPerson[];
    suggestion: LocationReviewSuggestion | null;
};

export function LocationGroupCard({
    idPrefix,
    title,
    badges,
    group,
    createDefaults,
    catalog,
    unitId,
    onUnitIdChange,
    ignored,
    busy,
    actionLabel,
    onAction,
    onCreate,
    onToggleIgnored,
    extraActions,
}: {
    idPrefix: string;
    title: ReactNode;
    badges?: ReactNode;
    group: LocationGroupCardData;
    createDefaults: { blockName: string; unitName: string };
    catalog: CatalogBlock[];
    unitId: string;
    onUnitIdChange: (unitId: string) => void;
    ignored: boolean;
    busy: boolean;
    actionLabel: string;
    onAction: () => void;
    onCreate: (input: { blockName: string; unitName: string }) => void;
    onToggleIgnored: () => void;
    extraActions?: ReactNode;
}) {
    const [pickedBlockId, setPickedBlockId] = useState("");
    const [creating, setCreating] = useState(false);
    const [blockName, setBlockName] = useState(createDefaults.blockName);
    const [unitName, setUnitName] = useState(createDefaults.unitName);
    const [showPeople, setShowPeople] = useState(false);

    const blockId = unitId ? blockIdOfUnit(catalog, unitId) : pickedBlockId;
    const suggested = group.suggestion && group.suggestion.unitId === unitId;
    const total = group.registrations + group.members;

    return (
        <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{title}</span>
                <Badge variant="secondary">
                    {group.registrations} cadastro(s) · {group.members} membro(s)
                </Badge>
                {badges}
                {suggested ? (
                    <Badge variant="outline">
                        {group.suggestion?.exact
                            ? "Sugestão exata"
                            : "Sugestão aproximada, confira"}
                    </Badge>
                ) : group.suggestion ? (
                    <Badge variant="outline">
                        Sugestão: {group.suggestion.blockName} /{" "}
                        {group.suggestion.unitName}
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
                    onClick={onAction}
                >
                    {actionLabel} {total}
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
                {extraActions}
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

export function PeopleList({
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
                    {person.kind === "registration"
                        ? "Cadastro sem membro"
                        : "Membro"}
                    {person.faceId != null ? ` · ID ${person.faceId}` : ""}
                    {person.active === false ? " · Inativo" : ""}
                </li>
            ))}
            {total != null && total > people.length ? (
                <li>e mais {total - people.length}…</li>
            ) : null}
        </ul>
    );
}
