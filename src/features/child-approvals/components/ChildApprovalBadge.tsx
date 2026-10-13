import { FileCheck2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ChildApprovalSummary } from '../types';

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
    if (row.childApprovalStatus === 'pending')
        return <Badge variant="secondary">Aguardando autorização</Badge>;
    return null;
}
