"use client";

import { Loader2 } from "lucide-react";

import {
    PERSON_CONTEXT_LABELS,
    type PersonLookupResult,
} from "@/lib/types/person-lookup";

export function PersonLookupBanner({
    lookupResult,
    checking,
    lookupError,
}: {
    lookupResult: PersonLookupResult | null;
    checking: boolean;
    lookupError: string | null;
}) {
    if (checking) {
        return (
            <div className="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-md border px-4 py-3 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Verificando CPF/e-mail…
            </div>
        );
    }

    if (lookupError) {
        return (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {lookupError}
            </div>
        );
    }

    if (!lookupResult) return null;

    if (lookupResult.conflict) {
        return (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {lookupResult.conflict}
            </div>
        );
    }

    if (!lookupResult.matched) return null;

    return (
        <div className="space-y-2 rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">
                {lookupResult.hasLogin
                    ? "Pessoa já cadastrada — será adicionado um novo vínculo de acesso em escolas."
                    : "Perfil encontrado sem login — informe a senha para criar a conta."}
            </p>
            {lookupResult.contexts.length > 0 ? (
                <ul className="text-muted-foreground list-inside list-disc space-y-0.5">
                    {lookupResult.contexts.map((ctx) => (
                        <li key={`${ctx.type}-${ctx.clientId}`}>
                            {PERSON_CONTEXT_LABELS[ctx.type]} em {ctx.clientName}
                            {!ctx.isActive ? " (inativo)" : ""}
                        </li>
                    ))}
                </ul>
            ) : null}
        </div>
    );
}
