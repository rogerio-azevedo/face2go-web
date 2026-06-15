'use client';

import { Copy, MonitorPlay, RefreshCw } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

import {
    ensureClientDisplayTokenAction,
    regenerateClientDisplayTokenAction,
} from '@/app/company/clientes/actions';
import { deferInEffect } from '@/lib/defer-in-effect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

type ClientMini = { id: string; name: string };

export function ClientTvDisplaySheet(props: {
    client: ClientMini | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { client, open, onOpenChange } = props;
    const [token, setToken] = useState<string | null>(null);
    const [shortCode, setShortCode] = useState<string | null>(null);
    const [loading, startTransition] = useTransition();

    useEffect(() => {
        deferInEffect(() => {
            if (!open || !client) {
                setToken(null);
                setShortCode(null);
                return;
            }
            setToken(null);
            setShortCode(null);
            startTransition(async () => {
                const r = await ensureClientDisplayTokenAction(client.id);
                if ('error' in r) {
                    toast.error(r.error);
                    setToken(null);
                    setShortCode(null);
                    return;
                }
                setToken(r.token);
                setShortCode(r.shortCode || null);
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- recarrega ao abrir o sheet / mudar cliente
    }, [open, client?.id]);

    const displayUrl =
        typeof window !== 'undefined' && client && token
            ? `${window.location.origin}/display/${client.id}?token=${encodeURIComponent(token)}`
            : '';

    const shortDisplayUrl =
        typeof window !== 'undefined' && shortCode
            ? `${window.location.origin}/display/${shortCode}`
            : '';

    const copyText = async (label: string, text: string) => {
        if (!text) {
            toast.error(`${label} ainda indisponível.`);
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copiada.`);
        } catch {
            toast.error('Não foi possível copiar.');
        }
    };

    const regenerate = () => {
        if (!client?.id) return;
        startTransition(async () => {
            const r = await regenerateClientDisplayTokenAction(client.id);
            if ('error' in r) {
                toast.error(r.error);
                return;
            }
            setToken(r.token);
            setShortCode(r.shortCode || null);
            toast.success(
                'Novo token gerado. Atualize a TV com a nova URL (curta ou completa).',
            );
        });
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex h-full w-full max-w-[min(100vw,42rem)] flex-col gap-5 overflow-y-auto px-6 pb-8 pt-6 sm:max-w-2xl sm:px-8 sm:pb-10"
            >
                <SheetHeader className="space-y-2 p-0">
                    <SheetTitle className="flex items-center gap-2 text-lg">
                        <MonitorPlay className="size-5 shrink-0" aria-hidden />
                        Display TV
                    </SheetTitle>
                    <SheetDescription>
                        Tela em tempo real para a escola: abra num navegador de
                        TV com esta URL. Mostra o último responsável que passou
                        pelo leitor e a fila recente.
                    </SheetDescription>
                </SheetHeader>

                {client ? (
                    <p className="-mt-1 text-sm font-medium text-foreground/90">
                        {client.name}
                    </p>
                ) : null}

                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        URL curta (recomendada para digitar na TV)
                    </p>
                    <Input
                        readOnly
                        value={
                            loading && !shortDisplayUrl
                                ? 'Carregando…'
                                : (shortDisplayUrl ?? '')
                        }
                        className="font-mono text-xs sm:text-sm"
                    />
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        URL completa (alternativa)
                    </p>
                    <Input
                        readOnly
                        value={
                            loading && !displayUrl
                                ? 'Carregando…'
                                : (displayUrl ?? '')
                        }
                        className="font-mono text-xs sm:text-sm"
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        disabled={loading || !shortDisplayUrl}
                        onClick={() =>
                            void copyText('URL curta', shortDisplayUrl)
                        }
                    >
                        <Copy className="size-4" aria-hidden />
                        Copiar URL curta
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={loading || !displayUrl}
                        onClick={() =>
                            void copyText('URL completa', displayUrl)
                        }
                    >
                        <Copy className="size-4" aria-hidden />
                        Copiar URL completa
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        onClick={regenerate}
                    >
                        <RefreshCw className="size-4" aria-hidden />
                        Novo token
                    </Button>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                    Regenerar o token invalida URLs antigas (curta e completa
                    continuam válidas, mas com o novo token interno). Use com
                    moderação se a URL vazar.
                </p>
            </SheetContent>
        </Sheet>
    );
}
