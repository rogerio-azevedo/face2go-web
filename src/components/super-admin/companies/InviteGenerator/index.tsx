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
    const [lastCode, setLastCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function generate() {
        setLoading(true);
        setLastCode(null);
        try {
            const formData = new FormData();
            formData.append("companyId", companyId);
            formData.append("role", role);
            const result = await generateInviteAction(formData);
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
            {lastCode ? (
                <div className="mt-2 break-all rounded bg-muted p-2 text-sm">
                    Link: {origin}/register?invite={lastCode}
                </div>
            ) : null}
        </div>
    );
}
