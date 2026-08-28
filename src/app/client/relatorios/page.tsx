import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { PageHeader } from '@/components/shared/PageHeader';
import { EnrollmentReport } from '@/features/reports/components/EnrollmentReport';

export default async function ClientReportsPage() {
  const session = await auth();
  const user = session?.user;
  const role = user?.role;

  if (
    !user?.clientId ||
    (role !== 'client_admin' && role !== 'client_operator')
  ) {
    redirect('/login?error=Sem permissão');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Acompanhe quem já cadastrou face e veículo na sua unidade."
      />
      <EnrollmentReport scope="client" clientId={user.clientId} />
    </div>
  );
}
