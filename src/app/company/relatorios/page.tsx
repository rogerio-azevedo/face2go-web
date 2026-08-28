import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { PageHeader } from '@/components/shared/PageHeader';
import { EnrollmentReport } from '@/features/reports/components/EnrollmentReport';
import { apiFetchAuthed } from '@/lib/api-fetch';
import { can } from '@/lib/permissions';
import type { ClientListRow } from '@/types/domain';

export default async function CompanyReportsPage() {
  const session = await auth();
  const user = session?.user;

  if (!user?.companyId) {
    redirect('/login?error=Sem permissão');
  }

  const role = user.role;
  const canAccess =
    role === 'company_admin' ||
    (role === 'company_operator' && (await can('reports', 'can_read')));

  if (!canAccess) {
    redirect('/company/dashboard');
  }

  let clients: ClientListRow[] = [];
  try {
    const res = await apiFetchAuthed('/api/clients');
    if (res.ok) {
      clients = (await res.json()) as ClientListRow[];
    }
  } catch {
    clients = [];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Acompanhe quem já cadastrou face e veículo em cada unidade."
      />
      <EnrollmentReport scope="company" clients={clients} />
    </div>
  );
}
