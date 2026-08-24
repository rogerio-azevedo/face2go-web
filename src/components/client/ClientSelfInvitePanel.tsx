"use client";

import { useCallback, useEffect, useState } from "react";

import {
    generateClientSelfInviteAction,
    listClientSelfInviteLinksAction,
} from "@/app/client/usuarios/client-system-actions";
import { InviteLinkGenerator } from "@/components/shared/InviteLinkGenerator";

type InvitesByRole = {
    client_admin?: string;
    client_operator?: string;
};

export function ClientSelfInvitePanel() {
    const [invitesByRole, setInvitesByRole] = useState<InvitesByRole>({});

    const loadInvites = useCallback(async () => {
        const result = await listClientSelfInviteLinksAction();
        if (!result.success) {
            setInvitesByRole({});
            return;
        }

        const byRole: InvitesByRole = {};
        for (const invite of result.invites) {
            if (!byRole[invite.role]) {
                byRole[invite.role] = invite.code;
            }
        }
        setInvitesByRole(byRole);
    }, []);

    useEffect(() => {
        void loadInvites();
    }, [loadInvites]);

    async function generateInvite(
        role: "client_admin" | "client_operator",
    ) {
        const result = await generateClientSelfInviteAction({ role });
        if (result.success) {
            await loadInvites();
        }
        return result;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <InviteLinkGenerator
                title="Convite — administrador do cliente"
                roleLabel="Administrador do cliente"
                existingCode={invitesByRole.client_admin}
                onGenerate={() => generateInvite("client_admin")}
            />
            <InviteLinkGenerator
                title="Convite — operador do cliente"
                roleLabel="Operador do cliente"
                existingCode={invitesByRole.client_operator}
                onGenerate={() => generateInvite("client_operator")}
            />
        </div>
    );
}
