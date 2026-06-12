"use client";

import {
    GuestRegisterWizard,
    formatDateForBlock,
} from "@/components/guest-register/GuestRegisterWizard";

type RetiradaWizardProps = {
    code: string;
};

export function RetiradaWizard({ code }: RetiradaWizardProps) {
    return (
        <GuestRegisterWizard
            code={code}
            apiPrefix="pickup-register"
            title="Cadastro de face — retirada"
            subtitleWithGuest={(name) => (
                <>
                    Olá, <strong>{name}</strong>
                </>
            )}
            subtitleWithoutGuest="Complete seus dados para continuar"
            doneMessage="O responsável que criou a autorização vai revisar sua foto. Você será avisado conforme a combinação com a escola."
            pendingApprovalMessage="Aguarde a aprovação do responsável."
            contextBlock={(preview) => (
                <>
                    <p>
                        <span className="font-medium">Aluno(s):</span>{" "}
                        {(preview.studentNames ?? []).join(", ") || "—"}
                    </p>
                    <p className="mt-2 text-muted-foreground">
                        Vigência: {formatDateForBlock(preview.validFrom)} —{" "}
                        {formatDateForBlock(preview.validUntil)}
                    </p>
                </>
            )}
        />
    );
}
