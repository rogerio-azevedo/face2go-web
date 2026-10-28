"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type InviteGenerateResult =
    | { success: true; code: string; registerUrl: string; joinUrl: string }
    | { success: false; error: string };

export function InviteLinkGenerator({
    title,
    roleLabel,
    onGenerate,
    existingCode,
}: {
    title: string;
    roleLabel: string;
    onGenerate: () => Promise<InviteGenerateResult>;
    existingCode?: string | null;
}) {
    const [lastInvite, setLastInvite] = useState<{
        registerUrl: string;
        joinUrl: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    async function generate() {
        setLoading(true);
        setLastInvite(null);
        try {
            const result = await onGenerate();
            if (result.success) {
                setLastInvite({
                    registerUrl: result.registerUrl,
                    joinUrl: result.joinUrl,
                });
                toast.success("Link gerado.");
            } else {
                toast.error(result.error);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-2 rounded-lg border p-4">
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground">Papel: {roleLabel}</p>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    onClick={generate}
                    size="sm"
                    variant="outline"
                    disabled={loading}
                >
                    {loading ? "Gerando..." : "Gerar novo link"}
                </Button>
            </div>
            {lastInvite ? (
                <div className="mt-2 space-y-2">
                    <div className="break-all rounded bg-muted p-2 text-sm">
                        <p className="text-xs font-medium text-muted-foreground">
                            Novo cadastro
                        </p>
                        Link: {lastInvite.registerUrl}
                    </div>
                    <div className="break-all rounded bg-muted p-2 text-sm">
                        <p className="text-xs font-medium text-muted-foreground">
                            Usuário existente
                        </p>
                        Link: {lastInvite.joinUrl}
                    </div>
                </div>
            ) : existingCode ? (
                <p className="text-xs text-muted-foreground">
                    Já existe um convite ativo. Gere um novo link para copiar o endereço no domínio da empresa.
                </p>
            ) : null}
        </div>
    );
}
