import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { CompanyUsersTable } from '@/components/company/usuarios/CompanyUsersTable';
import { CompanyInvitePanel } from '@/components/company/usuarios/CompanyInvitePanel';
import { PageHeader } from '@/components/shared/PageHeader';
import { apiFetchAuthed } from '@/lib/api-fetch';
import type { CompanyUserListRow } from '@/types/domain';

export default async function CompanyUsersPage() {
    const session = await auth();
    const user = session?.user;

    if (!user?.companyId || user.role !== 'company_admin') {
        redirect('/login?error=Sem permissão');
    }

    let users: CompanyUserListRow[] = [];
    let permissionsMap: Record<
        string,
        { featureSlug: string; actions: string[] }[]
    > = {};

    try {
        const res = await apiFetchAuthed('/api/company-users');
        if (res.ok) {
            const bundle = (await res.json()) as {
                users: CompanyUserListRow[];
                permissionsMap: Record<
                    string,
                    { featureSlug: string; actions: string[] }[]
                >;
            };
            users = bundle.users;
            permissionsMap = bundle.permissionsMap ?? {};
        }
    } catch {
        users = [];
        permissionsMap = {};
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Usuários da empresa"
                description="Papéis, dados de contato e permissões por módulo (operadores)."
            />
            <section className="space-y-3">
                <h2 className="text-sm font-medium">Convites</h2>
                <CompanyInvitePanel />
            </section>
            <CompanyUsersTable
                users={users}
                currentUserId={user.id}
                permissionsMap={permissionsMap}
            />
        </div>
    );
}
