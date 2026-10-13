'use client';

import Image from 'next/image';
import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChildApprovalPreview } from '../types';

export function ChildApprovalPhoto({
    token,
    preview,
    onReady,
}: {
    token: string;
    preview: ChildApprovalPreview;
    onReady: (ready: boolean) => void;
}) {
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);
    return (
        <div className="bg-muted/30 flex flex-col items-center gap-5 rounded-xl border p-5 sm:flex-row sm:items-start lg:flex-col lg:items-center">
            <div className="bg-background flex h-44 w-36 shrink-0 items-center justify-center overflow-hidden rounded-lg border lg:h-48 lg:w-40">
                {preview.hasPhoto && !failed ? (
                    <Image
                        key={attempt}
                        src={`/autorizar-menor/${token}/foto`}
                        alt={`Foto do cadastro de ${preview.childName}`}
                        width={240}
                        height={320}
                        unoptimized
                        className="h-full w-full object-contain"
                        onLoad={() => onReady(true)}
                        onError={() => {
                            setFailed(true);
                            onReady(false);
                        }}
                    />
                ) : (
                    <UserRound
                        className="text-muted-foreground size-10"
                        aria-hidden="true"
                    />
                )}
            </div>
            <div className="min-w-0 space-y-2 text-center sm:text-left lg:text-center">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                    Cadastro do menor
                </p>
                <h2 className="text-xl font-semibold">{preview.childName}</h2>
                <p className="text-sm">
                    Bloco {preview.block ?? '—'} · Unidade {preview.unit ?? '—'}
                </p>
                <p className="text-muted-foreground text-sm">
                    Confira se a foto corresponde ao menor antes de autorizar o
                    acesso.
                </p>
                {(failed || !preview.hasPhoto) && (
                    <p role="alert" className="text-destructive text-sm">
                        {preview.hasPhoto
                            ? 'Não foi possível carregar a foto. Tente novamente antes de autorizar.'
                            : 'Foto indisponível para este link. Solicite à administração a conferência do cadastro.'}
                    </p>
                )}
                {failed && preview.hasPhoto && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            onReady(false);
                            setFailed(false);
                            setAttempt((value) => value + 1);
                        }}
                    >
                        Carregar foto novamente
                    </Button>
                )}
            </div>
        </div>
    );
}
