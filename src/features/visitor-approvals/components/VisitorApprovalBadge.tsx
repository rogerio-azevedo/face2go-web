import { AlertTriangle, FileCheck2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { VisitorApprovalSummary } from '../types';

const NO_ADULT_TITLE =
    'Nenhum adulto elegível aprovado nesta unidade (nascimento, CPF e e-mail). O gestor pode aprovar ou ajustar o cadastro.';

export function VisitorApprovalBadge({
    row,
}: {
    row: Partial<VisitorApprovalSummary>;
}) {
    if (row.visitorApprovalStatus === 'authorized')
        return (
            <Badge variant="outline">
                <FileCheck2 className="size-3" aria-hidden />
                Visitante autorizado
            </Badge>
        );
    if (row.visitorApprovalStatus === 'pending') {
        if (row.visitorApprovalPendingReason === 'no_eligible_adult')
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
        return (
            <Badge variant="secondary">Visitante aguardando autorização</Badge>
        );
    }
    return null;
}
