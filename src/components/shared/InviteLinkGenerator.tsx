"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type InviteGenerateResult =
    | { success: true; code: string }
    | { success: false; error: string };

export function InviteLinkGenerator({
    title,
    roleLabel,
    onGenerate,
}: {
    title: string;
    roleLabel: string;
    onGenerate: () => Promise<InviteGenerateResult>;
}) {
    const [lastCode, setLastCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function generate() {
        setLoading(true);
        setLastCode(null);
        try {
            const result = await onGenerate();
            if (result.success) {
                setLastCode(result.code);
                toast.success("Link gerado.");
            } else {
                toast.error(result.error);
            }
        } finally {
            setLoading(false);
        }
    }

    const origin =
        typeof window !== "undefined" ? window.location.origin : "";

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
            {lastCode ? (
                <div className="mt-2 space-y-2">
                    <div className="break-all rounded bg-muted p-2 text-sm">
                        <p className="text-xs font-medium text-muted-foreground">
                            Novo cadastro
                        </p>
                        Link: {origin}/register?invite={lastCode}
                    </div>
                    <div className="break-all rounded bg-muted p-2 text-sm">
                        <p className="text-xs font-medium text-muted-foreground">
                            Usuário existente
                        </p>
                        Link: {origin}/join?invite={lastCode}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
