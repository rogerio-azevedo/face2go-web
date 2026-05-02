import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ClientsTable } from '@/components/company/clientes/ClientsTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { apiFetchAuthed } from '@/lib/api-fetch';
import { can } from '@/lib/permissions';
import type { ClientListRow } from '@/types/domain';

export default async function CompanyClientsPage() {
    const session = await auth();
    const user = session?.user;

    if (!user?.companyId) {
        redirect('/login?error=Sem permissão');
    }

    const role = user.role;
    const canAccess =
        role === 'company_admin' ||
        (role === 'company_operator' && (await can('clients', 'can_read')));

    if (!canAccess) {
        redirect('/company/dashboard');
    }

    const canManage = role === 'company_admin';

    let rows: ClientListRow[] = [];
    try {
        const res = await apiFetchAuthed('/api/clients');
        if (res.ok) {
            rows = (await res.json()) as ClientListRow[];
        }
    } catch {
        rows = [];
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Clientes"
                description="Cadastro das unidades atendidas pela sua empresa."
            />
            <ClientsTable clients={rows} canManage={canManage} />
        </div>
    );
}
