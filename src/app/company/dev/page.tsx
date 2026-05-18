import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { PageHeader } from '@/components/shared/PageHeader';
import { apiFetchAuthed, parseResponseJson } from '@/lib/api-fetch';

import { SimulateAccessTool } from './SimulateAccessTool';

type ClientListRow = {
    id: string;
    name: string;
};

export default async function CompanyDevSimulatePage() {
    const session = await auth();
    if (session?.user?.role !== 'company_admin') {
        redirect('/company/dashboard');
    }

    let clients: ClientListRow[] = [];
    try {
        const res = await apiFetchAuthed('/api/clients');
        if (res.ok) {
            const data = await parseResponseJson(res);
            if (Array.isArray(data)) {
                clients = data
                    .map((row) =>
                        row && typeof row === 'object'
                            ? (row as { id?: string; name?: string })
                            : null,
                    )
                    .filter(
                        (r): r is ClientListRow =>
                            r !== null &&
                            typeof r.id === 'string' &&
                            typeof r.name === 'string',
                    );
            }
        }
    } catch {
        clients = [];
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Simulação de acessos (Dev)"
                description="Fluxo do leitor no backend, sem hardware."
            />

            <SimulateAccessTool clients={clients} />
        </div>
    );
}
