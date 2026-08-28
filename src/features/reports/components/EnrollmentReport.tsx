'use client';

import { useMemo, useState } from 'react';

import { ReportFiltersBar } from '@/features/reports/components/ReportFiltersBar';
import { ReportSummaryBar } from '@/features/reports/components/ReportSummaryBar';
import { ReportTable } from '@/features/reports/components/ReportTable';
import {
  useEnrollmentList,
  useEnrollmentSummary,
} from '@/features/reports/hooks/use-enrollment-report';
import type {
  EnrollmentGroup,
  EnrollmentListItem,
  EnrollmentReportScope,
} from '@/features/reports/types';
import { groupsForClientType } from '@/features/reports/types';
import { emptyPaginated } from '@/lib/pagination';
import type { ClientListRow } from '@/types/domain';

type EnrollmentReportProps = {
  scope: EnrollmentReportScope;
  clients?: ClientListRow[];
  clientId?: string;
};

const PAGE_SIZE = 20;
const ALL_GROUPS: EnrollmentGroup[] = [
  'students',
  'responsibles',
  'members',
];

export function EnrollmentReport({
  scope,
  clients = [],
  clientId: initialClientId,
}: EnrollmentReportProps) {
  const [clientId, setClientId] = useState(initialClientId ?? '');
  const [group, setGroup] = useState<EnrollmentGroup>('students');
  const [classId, setClassId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const selectedClient = clients.find((client) => client.id === clientId);
  const queryInput = {
    scope,
    clientId: clientId || undefined,
    group,
    classId: group === 'students' ? classId || undefined : undefined,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const summaryQuery = useEnrollmentSummary(queryInput);
  const listQuery = useEnrollmentList(queryInput);

  const clientType =
    selectedClient?.type ?? summaryQuery.data?.clientType ?? null;
  const groups = clientType ? groupsForClientType(clientType) : ALL_GROUPS;
  if (clientType && !groups.includes(group) && groups[0]) {
    setGroup(groups[0]);
    setClassId('');
    setPage(1);
  }

  const list = listQuery.data ?? emptyPaginated<EnrollmentListItem>();
  const activeClients = useMemo(
    () =>
      clients
        .filter((client) => client.isActive)
        .map((client) => ({ id: client.id, name: client.name })),
    [clients],
  );

  const hasSelection = scope === 'client' || Boolean(clientId);

  return (
    <div className="space-y-4">
      <ReportFiltersBar
        scope={scope}
        clients={activeClients}
        clientId={clientId || undefined}
        onClientIdChange={(next) => {
          setClientId(next);
          setClassId('');
          setSearch('');
          setPage(1);
          const nextClient = clients.find((client) => client.id === next);
          const nextGroups = groupsForClientType(nextClient?.type);
          if (nextGroups[0] && !nextGroups.includes(group)) {
            setGroup(nextGroups[0]);
          }
        }}
        groups={groups}
        group={groups.includes(group) ? group : (groups[0] ?? 'members')}
        onGroupChange={(next) => {
          setGroup(next);
          setClassId('');
          setPage(1);
        }}
        classes={summaryQuery.data?.classes ?? []}
        classId={classId}
        onClassIdChange={(next) => {
          setClassId(next);
          setPage(1);
        }}
        search={search}
        onSearchChange={(next) => {
          setSearch(next);
          setPage(1);
        }}
        exportDisabled={!hasSelection || list.total === 0}
      />

      {!hasSelection ? (
        <p className="text-muted-foreground text-sm">
          Selecione um cliente para ver quem já cadastrou face e veículo.
        </p>
      ) : (
        <>
          {summaryQuery.isError ? (
            <p className="text-destructive text-sm">
              {summaryQuery.error instanceof Error
                ? summaryQuery.error.message
                : 'Não foi possível carregar o resumo.'}
            </p>
          ) : (
            <ReportSummaryBar
              summary={summaryQuery.data}
              loading={summaryQuery.isLoading}
            />
          )}
          <ReportTable
            rows={list.data}
            loading={listQuery.isLoading}
            showClass={group === 'students'}
            showRole={group === 'members'}
            showVehicle={group !== 'students'}
            page={list.page}
            pageSize={list.pageSize}
            total={list.total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
