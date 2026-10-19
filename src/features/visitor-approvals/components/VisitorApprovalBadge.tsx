import { FileCheck2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { VisitorApprovalSummary } from '../types';

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
    if (row.visitorApprovalStatus === 'pending')
        return <Badge variant="secondary">Visitante aguardando autorização</Badge>;
    return null;
}
