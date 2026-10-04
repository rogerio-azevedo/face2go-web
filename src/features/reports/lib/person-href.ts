import type {
  EnrollmentGroup,
  EnrollmentReportScope,
} from '@/features/reports/types';
import type { SchoolSection } from '@/features/school/lib/school-section';

const SCHOOL_SECTION: Record<
  Exclude<EnrollmentGroup, 'registrations'>,
  SchoolSection
> = {
  students: 'students',
  responsibles: 'parents',
  members: 'members',
};

export function reportPersonHref(params: {
  scope: EnrollmentReportScope;
  clientId?: string;
  group: EnrollmentGroup;
  id: string;
  name: string;
}): string | null {
  const { scope, clientId, group, id, name } = params;
  const query = new URLSearchParams({ q: name, open: id });

  if (group === 'registrations') {
    query.set('tab', 'approved');
    if (scope === 'client') return `/client/cadastros?${query}`;
    return clientId
      ? `/company/clientes/${clientId}/usuarios?${query}`
      : null;
  }

  if (scope === 'client' || !clientId) return null;
  query.set('section', SCHOOL_SECTION[group]);
  return `/company/clientes/${clientId}/usuarios?${query}`;
}
