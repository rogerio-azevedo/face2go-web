'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type {
  EnrollmentGroup,
  EnrollmentReportScope,
} from '@/features/reports/types';

type ExportCsvButtonProps = {
  scope: EnrollmentReportScope;
  clientId?: string;
  group: EnrollmentGroup;
  classId?: string;
  search?: string;
  disabled?: boolean;
};

export function ExportCsvButton({
  scope,
  clientId,
  group,
  classId,
  search,
  disabled,
}: ExportCsvButtonProps) {
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    if (scope === 'company' && !clientId) return;
    setPending(true);
    try {
      const sp = new URLSearchParams();
      sp.set('scope', scope);
      if (clientId) sp.set('clientId', clientId);
      sp.set('group', group);
      if (classId) sp.set('classId', classId);
      const trimmed = search?.trim();
      if (trimmed) sp.set('search', trimmed);

      const res = await fetch(`/api/reports/enrollment/export?${sp.toString()}`);
      if (!res.ok) {
        toast.error('Não foi possível exportar o CSV.');
        return;
      }
      const blob = await res.blob();
      const header = res.headers.get('content-disposition');
      const match = header?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? 'relatorio-cadastro.csv';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível exportar o CSV.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => void onClick()}
      disabled={disabled || pending}
    >
      <Download data-icon="inline-start" />
      {pending ? 'Exportando…' : 'Exportar CSV'}
    </Button>
  );
}
