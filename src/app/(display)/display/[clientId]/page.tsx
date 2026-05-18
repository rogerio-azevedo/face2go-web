import { redirect } from 'next/navigation';

import { apiFetchPublic, parseResponseJson } from '@/lib/api-fetch';

import DisplayClientRoute from './DisplayClient';

type PageProps = {
    params: Promise<{ clientId: string }>;
    searchParams: Promise<{ token?: string | string[] }>;
};

/** v4 UUID — segmento `[clientId]` só é tratado como UUID se casar aqui. */
const CLIENT_UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function looksLikeDisplayShortCode(segment: string): boolean {
    return (
        segment.length >= 4 &&
        segment.length <= 8 &&
        /^[0-9a-zA-Z]+$/.test(segment) &&
        !CLIENT_UUID_RE.test(segment)
    );
}

export default async function TvDisplayPage({
    params,
    searchParams,
}: PageProps) {
    const { clientId: rawSegment } = await params;
    const segment = rawSegment?.trim() ?? '';

    if (looksLikeDisplayShortCode(segment)) {
        const res = await apiFetchPublic(
            `/api/clients/display/resolve/${encodeURIComponent(segment)}`,
        );

        if (!res.ok) {
            return (
                <div className="flex min-h-[100svh] flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
                    <p className="text-lg font-semibold">Código inválido</p>
                    <p className="mt-2 max-w-md text-sm text-white/60">
                        Este link curto não existe ou o display ainda não foi
                        configurado. Gere o código no painel em Clientes · Display
                        TV.
                    </p>
                </div>
            );
        }

        const json = (await parseResponseJson(res)) as {
            clientId?: unknown;
            token?: unknown;
        };
        const resolvedId =
            typeof json.clientId === 'string' ? json.clientId.trim() : '';
        const resolvedToken =
            typeof json.token === 'string' ? json.token.trim() : '';

        if (!resolvedId || !resolvedToken) {
            return (
                <div className="flex min-h-[100svh] flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
                    <p className="text-lg font-semibold">Resposta inválida</p>
                    <p className="mt-2 max-w-md text-sm text-white/60">
                        Não foi possível obter o endereço do display. Tente de
                        novo mais tarde.
                    </p>
                </div>
            );
        }

        redirect(
            `/display/${resolvedId}?token=${encodeURIComponent(resolvedToken)}`,
        );
    }

    const qp = await searchParams;
    const raw = qp.token;
    const token = Array.isArray(raw) ? raw[0]?.trim() : raw?.trim();

    if (!token) {
        return (
            <div className="flex min-h-[100svh] flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
                <p className="text-lg font-semibold">Token obrigatório</p>
                <p className="mt-2 max-w-md text-sm text-white/60">
                    Abra esta página com{' '}
                    <code className="rounded bg-black/40 px-1">?token=</code>{' '}
                    na URL, gerado pelo painel da empresa em Clientes · Display TV.
                    Ou use o{' '}
                    <span className="font-medium text-white/80">
                        link curto
                    </span>{' '}
                    do painel, sem precisar do token na barra de endereços.
                </p>
            </div>
        );
    }

    return <DisplayClientRoute clientId={segment} token={token} />;
}
