"use client";

import { useState } from "react";
import { toast } from "sonner";

import { generateInviteAction } from "@/app/super-admin/companies/[id]/actions";
import { Button } from "@/components/ui/button";

type CompanyInviteRole = "company_admin" | "company_operator";

const roleLabels: Record<CompanyInviteRole, string> = {
    company_admin: "Administrador da empresa",
    company_operator: "Operador",
};

export function InviteGenerator({
    companyId,
    role,
    title,
}: {
    companyId: string;
    role: CompanyInviteRole;
    title?: string;
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
            const formData = new FormData();
            formData.append("companyId", companyId);
            formData.append("role", role);
            const result = await generateInviteAction(formData);
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
            <h3 className="text-sm font-semibold">
                {title ?? `Convite — ${roleLabels[role]}`}
            </h3>
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
            ) : null}
        </div>
    );
}
