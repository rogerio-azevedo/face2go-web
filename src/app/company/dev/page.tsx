import { redirect } from 'next/navigation';

import { auth } from '@/auth';
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
        <div className="space-y-8">
            <header className="space-y-1">
                <h1 className="text-foreground text-2xl font-semibold tracking-tight">
                    Simulação de acessos (Dev)
                </h1>
                <p className="text-muted-foreground max-w-2xl text-sm">
                    Dispara o mesmo fluxo do leitor físico no backend (registro em
                    acessos, notificações e display em TV), sem usar o equipamento.
                </p>
            </header>

            <SimulateAccessTool clients={clients} />
        </div>
    );
}
