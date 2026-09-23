'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const EXPORT_OPTIONS = [
  { status: 'draft', label: 'Aguardando aprovação' },
  { status: 'approved', label: 'Aprovados' },
  { status: 'rejected', label: 'Rejeitados' },
  { status: 'blocked', label: 'Bloqueados' },
  { status: 'deleted', label: 'Excluídos' },
] as const;

type ExportStatus = (typeof EXPORT_OPTIONS)[number]['status'] | 'all';

type ExportRegistrationsExcelButtonProps = {
  variant: 'client' | 'company';
  companyClientId?: string;
  search?: string;
  block?: string;
  unit?: string;
  room?: string;
};

export function ExportRegistrationsExcelButton({
  variant,
  companyClientId,
  search,
  block,
  unit,
  room,
}: ExportRegistrationsExcelButtonProps) {
  const [pending, setPending] = useState(false);

  const download = async (status: ExportStatus) => {
    if (variant === 'company' && !companyClientId) return;
    setPending(true);
    try {
      const sp = new URLSearchParams();
      sp.set('scope', variant);
      if (companyClientId) sp.set('clientId', companyClientId);
      sp.set('status', status);
      const trimmed = search?.trim();
      if (trimmed) sp.set('search', trimmed);
      const blockTrimmed = block?.trim();
      if (blockTrimmed) sp.set('block', blockTrimmed);
      const unitTrimmed = unit?.trim();
      if (unitTrimmed) sp.set('unit', unitTrimmed);
      const roomTrimmed = room?.trim();
      if (roomTrimmed) sp.set('room', roomTrimmed);

      const res = await fetch(`/api/registrations/export?${sp.toString()}`);
      if (!res.ok) {
        toast.error('Não foi possível exportar o Excel.');
        return;
      }
      const blob = await res.blob();
      const header = res.headers.get('content-disposition');
      const match = header?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? 'cadastros.xlsx';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Não foi possível exportar o Excel.');
    } finally {
      setPending(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || (variant === 'company' && !companyClientId)}
          >
            <Download data-icon="inline-start" />
            {pending ? 'Exportando…' : 'Exportar Excel'}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-auto min-w-48">
        {EXPORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.status}
            disabled={pending}
            onClick={() => void download(option.status)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={pending}
          onClick={() => void download('all')}
        >
          Todos
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
