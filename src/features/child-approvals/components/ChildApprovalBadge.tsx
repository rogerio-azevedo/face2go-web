import { AlertTriangle, FileCheck2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ChildApprovalSummary } from '../types';

const NO_ADULT_TITLE =
    'Nenhum adulto elegível aprovado nesta unidade (nascimento, CPF e e-mail). O gestor pode aprovar ou ajustar o cadastro.';

export function ChildApprovalBadge({
    row,
}: {
    row: Partial<ChildApprovalSummary>;
}) {
    if (row.childApprovalStatus === 'authorized')
        return (
            <Badge variant="outline">
                <FileCheck2 className="size-3" aria-hidden />
                Autorizado
            </Badge>
        );
    if (row.childApprovalStatus === 'pending') {
        if (row.childApprovalPendingReason === 'no_eligible_adult')
            return (
                <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 font-medium text-amber-950 hover:bg-amber-50"
                    title={NO_ADULT_TITLE}
                >
                    <AlertTriangle className="size-3" aria-hidden />
                    Sem adulto na unidade
                </Badge>
            );
        return <Badge variant="secondary">Aguardando autorização</Badge>;
    }
    return null;
}
