"use client";

import { InviteLinkGenerator } from "@/components/shared/InviteLinkGenerator";
import { generateClientInviteFromCompanyAction } from "@/app/company/clientes/[clientId]/usuarios/client-system-actions";

export function CompanyClientInvitePanel({
    clientId,
    onInviteGenerated,
}: {
    clientId: string;
    onInviteGenerated?: () => void;
}) {
    async function generateInvite(
        role: "client_admin" | "client_operator",
    ) {
        const result = await generateClientInviteFromCompanyAction({
            clientId,
            role,
        });
        if (result.success) {
            onInviteGenerated?.();
        }
        return result;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <InviteLinkGenerator
                title="Convite — administrador do cliente"
                roleLabel="Administrador do cliente"
                onGenerate={() => generateInvite("client_admin")}
            />
            <InviteLinkGenerator
                title="Convite — operador do cliente"
                roleLabel="Operador do cliente"
                onGenerate={() => generateInvite("client_operator")}
            />
        </div>
    );
}
