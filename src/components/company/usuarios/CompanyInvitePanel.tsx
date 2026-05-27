"use client";

import { InviteLinkGenerator } from "@/components/shared/InviteLinkGenerator";
import { generateCompanyInviteAction } from "@/app/company/usuarios/actions";

export function CompanyInvitePanel() {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <InviteLinkGenerator
                title="Convite — administrador da empresa"
                roleLabel="Administrador da empresa"
                onGenerate={() =>
                    generateCompanyInviteAction({ role: "company_admin" })
                }
            />
            <InviteLinkGenerator
                title="Convite — operador"
                roleLabel="Operador"
                onGenerate={() =>
                    generateCompanyInviteAction({ role: "company_operator" })
                }
            />
        </div>
    );
}
