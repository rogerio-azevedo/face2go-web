"use client";

import { InviteLinkGenerator } from "@/components/shared/InviteLinkGenerator";
import { generateClientInviteFromCompanyAction } from "@/app/company/clientes/[clientId]/usuarios/client-system-actions";

export function CompanyClientInvitePanel({ clientId }: { clientId: string }) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <InviteLinkGenerator
                title="Convite — administrador do cliente"
                roleLabel="Administrador do cliente"
                onGenerate={() =>
                    generateClientInviteFromCompanyAction({
                        clientId,
                        role: "client_admin",
                    })
                }
            />
            <InviteLinkGenerator
                title="Convite — operador do cliente"
                roleLabel="Operador do cliente"
                onGenerate={() =>
                    generateClientInviteFromCompanyAction({
                        clientId,
                        role: "client_operator",
                    })
                }
            />
        </div>
    );
}
