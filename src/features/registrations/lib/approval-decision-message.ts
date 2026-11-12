/** Mensagem do toast após POST /approve — distingue defer (ainda pendente) de conclusão. */
export function approvalDecisionMessage(data: unknown): string {
    const row = data as {
        childApprovalStatus?: string;
        visitorApprovalStatus?: string;
    } | null;
    if (
        row?.childApprovalStatus === 'pending' ||
        row?.visitorApprovalStatus === 'pending'
    ) {
        return 'Aprovação solicitada. Aguardando o aceite de um adulto da mesma unidade.';
    }
    return 'Cadastro aprovado.';
}
