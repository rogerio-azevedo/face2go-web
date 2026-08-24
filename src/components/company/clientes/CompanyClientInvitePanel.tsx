"use client";

import { useCallback, useEffect, useState } from "react";

import {
    generateClientInviteFromCompanyAction,
    listClientInviteLinksAction,
} from "@/app/company/clientes/[clientId]/usuarios/client-system-actions";
import { InviteLinkGenerator } from "@/components/shared/InviteLinkGenerator";

type InvitesByRole = {
    client_admin?: string;
    client_operator?: string;
};

export function CompanyClientInvitePanel({
    clientId,
    onInviteGenerated,
}: {
    clientId: string;
    onInviteGenerated?: () => void;
}) {
    const [invitesByRole, setInvitesByRole] = useState<InvitesByRole>({});

    const loadInvites = useCallback(async () => {
        const result = await listClientInviteLinksAction(clientId);
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
    }, [clientId]);

    useEffect(() => {
        void loadInvites();
    }, [loadInvites]);

    async function generateInvite(
        role: "client_admin" | "client_operator",
    ) {
        const result = await generateClientInviteFromCompanyAction({
            clientId,
            role,
        });
        if (result.success) {
            await loadInvites();
            onInviteGenerated?.();
        }
        return result;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <InviteLinkGenerator
                key={`${clientId}-client_admin`}
                title="Convite — administrador do cliente"
                roleLabel="Administrador do cliente"
                existingCode={invitesByRole.client_admin}
                onGenerate={() => generateInvite("client_admin")}
            />
            <InviteLinkGenerator
                key={`${clientId}-client_operator`}
                title="Convite — operador do cliente"
                roleLabel="Operador do cliente"
                existingCode={invitesByRole.client_operator}
                onGenerate={() => generateInvite("client_operator")}
            />
        </div>
    );
}
