"use client";

import { InviteLinkGenerator } from "@/components/shared/InviteLinkGenerator";
import { generateClientSelfInviteAction } from "@/app/client/usuarios/client-system-actions";

export function ClientSelfInvitePanel() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <InviteLinkGenerator
                title="Convite — administrador do cliente"
                roleLabel="Administrador do cliente"
                onGenerate={() =>
                    generateClientSelfInviteAction({ role: "client_admin" })
                }
            />
            <InviteLinkGenerator
                title="Convite — operador do cliente"
                roleLabel="Operador do cliente"
                onGenerate={() =>
                    generateClientSelfInviteAction({ role: "client_operator" })
                }
            />
        </div>
    );
}
