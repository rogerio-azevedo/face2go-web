"use client";

import { useMemo, useState } from "react";

export const LOCATION_PAGE_SIZE = 50;

/** Busca, ignorados, paginação e unidade escolhida por grupo. */
export function useLocationGroupList<T extends { key: string }>({
    groups,
    searchText,
    defaultUnitId,
}: {
    groups: T[];
    searchText: (group: T) => string;
    defaultUnitId: (group: T) => string;
}) {
    const [picked, setPicked] = useState<Record<string, string>>({});
    const [ignored, setIgnored] = useState<Set<string>>(new Set());
    const [showIgnored, setShowIgnored] = useState(false);
    const [search, setSearch] = useState("");
    const [visible, setVisible] = useState(LOCATION_PAGE_SIZE);

    const term = search.trim().toLowerCase();
    const filtered = useMemo(
        () =>
            groups.filter((group) => {
                if (ignored.has(group.key) !== showIgnored) return false;
                if (!term) return true;
                return searchText(group).toLowerCase().includes(term);
            }),
        [groups, ignored, showIgnored, term, searchText],
    );

    function unitIdOf(group: T) {
        return picked[group.key] ?? defaultUnitId(group);
    }

    const resolved = groups.filter(
        (group) => !ignored.has(group.key) && unitIdOf(group),
    );

    return {
        filtered,
        resolved,
        visible,
        search,
        showIgnored,
        ignoredCount: ignored.size,
        isIgnored: (key: string) => ignored.has(key),
        unitIdOf,
        pick: (key: string, unitId: string) =>
            setPicked((current) => ({ ...current, [key]: unitId })),
        setSearch: (value: string) => {
            setSearch(value);
            setVisible(LOCATION_PAGE_SIZE);
        },
        toggleShowIgnored: () => {
            setShowIgnored((value) => !value);
            setVisible(LOCATION_PAGE_SIZE);
        },
        toggleIgnored: (key: string) =>
            setIgnored((current) => {
                const next = new Set(current);
                if (next.has(key)) next.delete(key);
                else next.add(key);
                return next;
            }),
        showMore: () => setVisible((value) => value + LOCATION_PAGE_SIZE),
    };
}
