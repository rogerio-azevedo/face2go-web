import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ClientUsersTab } from '@/components/company/usuarios/ClientUsersTab';
import { CompanyUsersTable } from '@/components/company/usuarios/CompanyUsersTable';
import { CompanyInvitePanel } from '@/components/company/usuarios/CompanyInvitePanel';
import { PageHeader } from '@/components/shared/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetchAuthed, parseResponseJson } from '@/lib/api-fetch';
import type { ClientListRow, CompanyUserListRow } from '@/types/domain';

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
    let clients: { id: string; name: string }[] = [];

    try {
        const [usersRes, clientsRes] = await Promise.all([
            apiFetchAuthed('/api/company-users'),
            apiFetchAuthed('/api/clients'),
        ]);

        if (usersRes.ok) {
            const bundle = (await usersRes.json()) as {
                users: CompanyUserListRow[];
                permissionsMap: Record<
                    string,
                    { featureSlug: string; actions: string[] }[]
                >;
            };
            users = bundle.users;
            permissionsMap = bundle.permissionsMap ?? {};
        }

        if (clientsRes.ok) {
            const rows = (await parseResponseJson(clientsRes)) as
                | ClientListRow[]
                | null;
            clients = (rows ?? []).map((row) => ({
                id: row.id,
                name: row.name,
            }));
        }
    } catch {
        users = [];
        permissionsMap = {};
        clients = [];
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Usuários do sistema"
                description="Usuários da empresa e usuários do sistema de cada cliente. Convites para acesso ao painel — não confundir com links de cadastro público."
            />
            <Tabs defaultValue="empresa">
                <TabsList className="w-full justify-start md:w-fit">
                    <TabsTrigger value="empresa">Empresa</TabsTrigger>
                    <TabsTrigger value="clientes">Clientes</TabsTrigger>
                </TabsList>
                <TabsContent value="empresa" className="mt-6 space-y-6">
                    <section className="space-y-3">
                        <div className="space-y-1">
                            <h2 className="text-sm font-medium">Convites</h2>
                            <p className="text-sm text-muted-foreground">
                                Links para administradores e operadores da
                                empresa.
                            </p>
                        </div>
                        <CompanyInvitePanel />
                    </section>
                    <CompanyUsersTable
                        users={users}
                        currentUserId={user.id}
                        permissionsMap={permissionsMap}
                    />
                </TabsContent>
                <TabsContent value="clientes" className="mt-6">
                    <ClientUsersTab clients={clients} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
