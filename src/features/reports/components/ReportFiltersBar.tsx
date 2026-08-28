'use client';

import { SearchInput } from '@/components/ui/search-input';
import { Button } from '@/components/ui/button';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import type {
  EnrollmentGroup,
  EnrollmentReportScope,
} from '@/features/reports/types';
import { ENROLLMENT_GROUP_LABEL } from '@/features/reports/types';
import { cn } from '@/lib/utils';

type ClientOption = { id: string; name: string };

type ClassOption = { id: string; name: string };

type ReportFiltersBarProps = {
  scope: EnrollmentReportScope;
  clients?: ClientOption[];
  clientId?: string;
  onClientIdChange?: (clientId: string) => void;
  groups: EnrollmentGroup[];
  group: EnrollmentGroup;
  onGroupChange: (group: EnrollmentGroup) => void;
  classes: ClassOption[];
  classId: string;
  onClassIdChange: (classId: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  exportDisabled?: boolean;
};

const selectClassName =
  'h-9 w-full min-w-[10rem] rounded-md border border-input bg-background px-3 text-sm';

export function ReportFiltersBar({
  scope,
  clients,
  clientId,
  onClientIdChange,
  groups,
  group,
  onGroupChange,
  classes,
  classId,
  onClassIdChange,
  search,
  onSearchChange,
  exportDisabled,
}: ReportFiltersBarProps) {
  const showClassFilter = group === 'students';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        {scope === 'company' && clients && onClientIdChange ? (
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium">
              Cliente
            </span>
            <select
              className={selectClassName}
              value={clientId ?? ''}
              onChange={(event) => onClientIdChange(event.target.value)}
            >
              <option value="">Selecione o cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {showClassFilter ? (
          <label className="flex min-w-[10rem] flex-1 flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium">
              Turma
            </span>
            <select
              className={selectClassName}
              value={classId}
              onChange={(event) => onClassIdChange(event.target.value)}
              disabled={!clientId && scope === 'company'}
            >
              <option value="">Todas as turmas</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium">
            Busca
          </span>
          <SearchInput
            value={search}
            onValueChange={onSearchChange}
            placeholder="Buscar por nome…"
            disabled={!clientId && scope === 'company'}
          />
        </div>

        <div className="pb-0.5">
          <ExportCsvButton
            scope={scope}
            clientId={clientId}
            group={group}
            classId={classId || undefined}
            search={search}
            disabled={exportDisabled}
          />
        </div>
      </div>

      {groups.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {groups.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant={item === group ? 'default' : 'outline'}
              className={cn(item === group && 'pointer-events-none')}
              onClick={() => onGroupChange(item)}
            >
              {ENROLLMENT_GROUP_LABEL[item]}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
