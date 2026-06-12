"use client";

import {
    GuestRegisterWizard,
    formatDateForBlock,
} from "@/components/guest-register/GuestRegisterWizard";

type ConviteWizardProps = {
    code: string;
};

export function ConviteWizard({ code }: ConviteWizardProps) {
    return (
        <GuestRegisterWizard
            code={code}
            apiPrefix="invite-register"
            title="Cadastro de face — visitante"
            subtitleWithGuest={(name) => (
                <>
                    Olá, <strong>{name}</strong>
                </>
            )}
            subtitleWithoutGuest="Complete seus dados para continuar"
            doneMessage="O funcionário que criou o convite vai revisar sua foto antes de liberar o acesso."
            pendingApprovalMessage="Aguarde a aprovação do funcionário."
            contextBlock={(preview) => (
                <p className="text-muted-foreground">
                    Vigência: {formatDateForBlock(preview.validFrom)} —{" "}
                    {formatDateForBlock(preview.validUntil)}
                </p>
            )}
        />
    );
}
