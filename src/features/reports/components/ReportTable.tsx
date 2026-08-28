'use client';

import { Car, ScanFace } from 'lucide-react';

import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { FaceCirclePhoto } from '@/components/ui/face-circle-photo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { EnrollmentListItem } from '@/features/reports/types';
import { cn } from '@/lib/utils';

type ReportTableProps = {
  rows: EnrollmentListItem[];
  loading: boolean;
  showClass: boolean;
  showRole: boolean;
  showVehicle: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

function StatusIcon({
  on,
  labelOn,
  labelOff,
  icon: Icon,
}: {
  on: boolean;
  labelOn: string;
  labelOff: string;
  icon: typeof ScanFace;
}) {
  return (
    <span
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-full',
        on
          ? 'bg-emerald-700 text-white'
          : 'text-muted-foreground/40',
      )}
      title={on ? labelOn : labelOff}
      aria-label={on ? labelOn : labelOff}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

export function ReportTable({
  rows,
  loading,
  showClass,
  showRole,
  showVehicle,
  page,
  pageSize,
  total,
  onPageChange,
}: ReportTableProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              {showClass ? <TableHead>Turma</TableHead> : null}
              {showRole ? <TableHead>Função</TableHead> : null}
              <TableHead className="w-16 text-center">Face</TableHead>
              {showVehicle ? (
                <TableHead className="w-20 text-center">Veículo</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    2 +
                    (showClass ? 1 : 0) +
                    (showRole ? 1 : 0) +
                    (showVehicle ? 1 : 0)
                  }
                  className="text-muted-foreground py-8 text-center"
                >
                  Carregando…
                </TableCell>
              </TableRow>
            ) : null}
            {!loading && rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    2 +
                    (showClass ? 1 : 0) +
                    (showRole ? 1 : 0) +
                    (showVehicle ? 1 : 0)
                  }
                  className="text-muted-foreground py-8 text-center"
                >
                  Nenhum registro encontrado para este filtro.
                </TableCell>
              </TableRow>
            ) : null}
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium whitespace-normal">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 shrink-0 overflow-hidden rounded-full bg-teal-100 ring-2 ring-teal-100">
                      <FaceCirclePhoto
                        className="size-full"
                        photoUrl={row.photoUrl ?? null}
                        nameHint={row.name}
                      />
                    </div>
                    <span>{row.name}</span>
                  </div>
                </TableCell>
                {showClass ? (
                  <TableCell className="text-muted-foreground whitespace-normal">
                    {row.className || '—'}
                  </TableCell>
                ) : null}
                {showRole ? (
                  <TableCell>
                    {row.roleName ? (
                      <Badge variant="outline">{row.roleName}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                ) : null}
                <TableCell className="p-1 text-center">
                  <StatusIcon
                    icon={ScanFace}
                    on={row.hasFace}
                    labelOn="Face cadastrada"
                    labelOff="Sem face"
                  />
                </TableCell>
                {showVehicle ? (
                  <TableCell className="p-1 text-center">
                    <StatusIcon
                      icon={Car}
                      on={row.hasVehicle === true}
                      labelOn="Veículo cadastrado"
                      labelOff="Sem veículo"
                    />
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        disabled={loading}
      />
    </div>
  );
}
