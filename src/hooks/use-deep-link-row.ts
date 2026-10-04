"use client";

import { useCallback, useRef } from "react";

/** Retorna a linha `openId` na primeira lista carregada e descarta o id depois disso. */
export function useDeepLinkRow(openId: string | undefined) {
    const pending = useRef(openId);

    return useCallback(<T extends { id: string }>(rows: T[]): T | undefined => {
        const id = pending.current;
        if (!id) return undefined;
        pending.current = undefined;
        return rows.find((row) => row.id === id);
    }, []);
}
