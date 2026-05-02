import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ReadersTable } from '@/components/company/leitores/ReadersTable';
import { PageHeader } from '@/components/shared/PageHeader';
import { apiFetchAuthed } from '@/lib/api-fetch';
import { can } from '@/lib/permissions';
import type { ClientListRow, ReaderListRow } from '@/types/domain';

export default async function CompanyReadersPage() {
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

    let readers: ReaderListRow[] = [];
    let clients: ClientListRow[] = [];

    try {
        const [readersRes, clientsRes] = await Promise.all([
            apiFetchAuthed('/api/readers'),
            apiFetchAuthed('/api/clients'),
        ]);

        if (readersRes.ok) {
            readers = (await readersRes.json()) as ReaderListRow[];
        }
        if (clientsRes.ok) {
            clients = (await clientsRes.json()) as ClientListRow[];
        }
    } catch {
        readers = [];
        clients = [];
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Leitores faciais"
                description="Cadastro de leitores vinculados aos clientes da empresa."
            />
            <ReadersTable
                readers={readers}
                clients={clients}
                canManage={canManage}
            />
        </div>
    );
}
