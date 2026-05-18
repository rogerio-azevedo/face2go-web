import DisplayClientRoute from './DisplayClient';

type PageProps = {
    params: Promise<{ clientId: string }>;
    searchParams: Promise<{ token?: string | string[] }>;
};

export default async function TvDisplayPage({ params, searchParams }: PageProps) {
    const { clientId } = await params;
    const qp = await searchParams;
    const raw = qp.token;
    const token = Array.isArray(raw) ? raw[0]?.trim() : raw?.trim();

    if (!token) {
        return (
            <div className="flex min-h-[100svh] flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
                <p className="text-lg font-semibold">Token obrigatório</p>
                <p className="mt-2 max-w-md text-sm text-white/60">
                    Abra esta página com <code className="rounded bg-black/40 px-1">?token=</code>{' '}
                    na URL, gerado pelo painel da empresa em Clientes · Display TV.
                </p>
            </div>
        );
    }

    return <DisplayClientRoute clientId={clientId} token={token} />;
}
