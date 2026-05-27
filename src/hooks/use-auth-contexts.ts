"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

import {
    contextStorageKey,
    loadActiveContext,
    loadContexts,
} from "@/lib/auth-contexts";
import type { UserContext } from "@/types/auth-context";

function fallbackContextLabel(role: string | undefined): string | null {
    switch (role) {
        case "super_admin":
            return "Super administrador";
        case "company_admin":
            return "Empresa (Admin)";
        case "company_operator":
            return "Empresa (Operador)";
        case "client_admin":
            return "Cliente (Admin)";
        case "client_operator":
            return "Cliente (Operador)";
        case "responsible":
            return "Responsável";
        case "face_user":
            return "Usuário facial";
        default:
            return null;
    }
}

export function useAuthContexts() {
    const { data: session } = useSession();

    const contexts = useMemo(() => {
        if (session?.contexts?.length) {
            return session.contexts;
        }
        return loadContexts();
    }, [session?.contexts]);

    const activeContext = useMemo((): UserContext | null => {
        if (session?.activeContext) {
            return session.activeContext;
        }

        const stored = loadActiveContext();
        if (stored) {
            return stored;
        }

        if (contexts.length === 1) {
            return contexts[0] ?? null;
        }

        return null;
    }, [session?.activeContext, contexts]);

    const displayLabel =
        activeContext?.label ??
        fallbackContextLabel(session?.user?.role) ??
        "Contexto ativo";

    const activeKey = activeContext
        ? contextStorageKey(activeContext)
        : null;

    return {
        contexts,
        activeContext,
        activeKey,
        displayLabel,
        accessToken: session?.accessToken,
        canSwitch:
            contexts.length > 1 &&
            !!session?.accessToken &&
            !!activeContext,
        isVisible: !!session?.accessToken && !!displayLabel,
    };
}
