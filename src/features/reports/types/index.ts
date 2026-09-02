import type { components } from '@/types/api.generated';

export type EnrollmentSummary = components['schemas']['EnrollmentSummaryDto'];
export type EnrollmentGroup = EnrollmentSummary['group'];
export type EnrollmentReportScope = 'company' | 'client';

export type EnrollmentListItem = {
  id: string;
  name: string;
  className?: string | null;
  roleName?: string | null;
  photoUrl?: string | null;
  hasFace: boolean;
  hasVehicle?: boolean;
  deviceSyncStatus: 'pending_sync' | 'synced' | 'sync_failed' | null;
  deviceSyncError?: string | null;
  hasFacialReaders: boolean;
  hasLogin?: boolean;
};

export type EnrollmentListResult = {
  data: EnrollmentListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export const ENROLLMENT_GROUP_LABEL: Record<EnrollmentGroup, string> = {
  students: 'Alunos',
  responsibles: 'Responsáveis',
  members: 'Membros',
};

export function groupsForClientType(
  clientType: string | null | undefined,
): EnrollmentGroup[] {
  if (clientType === 'school') {
    return ['students', 'responsibles', 'members'];
  }
  return ['members'];
}
