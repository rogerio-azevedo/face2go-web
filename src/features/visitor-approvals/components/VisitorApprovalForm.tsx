'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CircleCheckBig } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { acceptVisitorApproval, revokeOwnVisitorApproval } from '../actions';
import type { VisitorApprovalPreview } from '../types';
import { VisitorApprovalPhoto } from './VisitorApprovalPhoto';

export function VisitorApprovalForm({
    token,
    preview,
}: {
    token: string;
    preview: VisitorApprovalPreview;
}) {
    const [cpf, setCpf] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [confirmRevoke, setConfirmRevoke] = useState(false);
    const [message, setMessage] = useState<{
        action: 'accept' | 'revoke';
        text: string;
    } | null>(null);
    const [error, setError] = useState('');
    const [pending, startTransition] = useTransition();
    const [photoReady, setPhotoReady] = useState(false);
    const router = useRouter();
    const canRevoke = preview.accepted && !preview.revoked;
    const authorizationRegistered =
        !preview.revoked &&
        message?.action !== 'revoke' &&
        (canRevoke || message?.action === 'accept');
    function submit() {
        if (
            pending ||
            !cpf ||
            !(canRevoke ? confirmRevoke : agreed) ||
            (!canRevoke &&
                (!preview.canAccept || !preview.hasPhoto || !photoReady))
        )
            return;
        startTransition(async () => {
            setError('');
            const result = canRevoke
                ? await revokeOwnVisitorApproval(token, cpf)
                : await acceptVisitorApproval(token, {
                      cpf,
                      agreed: true,
                      termVersion: preview.termVersion,
                  });
            if (!result.ok) {
                setError(result.error);
                return;
            }
            setMessage({
                action: canRevoke ? 'revoke' : 'accept',
                text: result.data.message,
            });
            setCpf('');
            setConfirmRevoke(false);
            router.refresh();
        });
    }
    return (
        <section className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold">
                    Autorização de acesso de visitante
                </h1>
                <p className="text-muted-foreground">{preview.clientName}</p>
                <p className="text-sm">
                    Destinatário: <strong>{preview.adultName}</strong> · Bloco{' '}
                    {preview.block ?? '—'}, unidade {preview.unit ?? '—'}
                </p>
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
                <VisitorApprovalPhoto
                    token={token}
                    preview={preview}
                    onReady={setPhotoReady}
                />
                <div className="space-y-5">
                    {authorizationRegistered && (
                        <div
                            role="status"
                            className="border-brand-turquoise/25 bg-brand-turquoise/5 flex items-center gap-4 rounded-lg border p-4"
                        >
                            <CircleCheckBig
                                className="text-brand-turquoise size-12 shrink-0"
                                aria-hidden
                            />
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold">
                                    Tudo certo! Autorização registrada.
                                </h2>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {message?.action === 'accept'
                                        ? message.text
                                        : `Seu aceite para ${preview.visitorName} está registrado. Você pode revogá-lo abaixo.`}
                                </p>
                            </div>
                        </div>
                    )}
                    <div className="rounded-lg border bg-muted/40 p-5 text-sm leading-relaxed whitespace-pre-wrap">
                        {preview.termContent}
                    </div>
                    <p className="text-muted-foreground text-xs">
                        Versão do termo: {preview.termVersion}
                    </p>
                    {preview.revoked && (
                        <p role="status">
                            Este aceite foi revogado. Para autorizar novamente,
                            solicite um novo link à administração.
                        </p>
                    )}
                    {!preview.canAccept && !preview.accepted && (
                        <p role="status">
                            Este link expirou ou os cadastros não são mais
                            elegíveis. Solicite um novo link à administração.
                        </p>
                    )}
                    {message && !authorizationRegistered && (
                        <p
                            role="status"
                            className="rounded-lg border p-3 text-sm"
                        >
                            {message.text}
                        </p>
                    )}
                    {(preview.canAccept || canRevoke) && (
                        <form
                            className="space-y-4"
                            onSubmit={(e) => {
                                e.preventDefault();
                                submit();
                            }}
                        >
                            <div className="space-y-2">
                                <Label htmlFor="adult-cpf">
                                    CPF do seu cadastro
                                </Label>
                                <Input
                                    id="adult-cpf"
                                    inputMode="numeric"
                                    autoComplete="off"
                                    maxLength={14}
                                    required
                                    value={cpf}
                                    onChange={(e) => setCpf(e.target.value)}
                                    disabled={pending}
                                    aria-describedby="cpf-help"
                                />
                                <p
                                    id="cpf-help"
                                    className="text-muted-foreground text-xs"
                                >
                                    Digite o CPF cadastrado para o destinatário
                                    deste link.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="approval-confirm"
                                    checked={canRevoke ? confirmRevoke : agreed}
                                    onCheckedChange={(value) =>
                                        canRevoke
                                            ? setConfirmRevoke(value === true)
                                            : setAgreed(value === true)
                                    }
                                    disabled={pending}
                                />
                                <Label
                                    htmlFor="approval-confirm"
                                    className="text-sm leading-relaxed"
                                >
                                    {canRevoke
                                        ? 'Confirmo que desejo revogar meu aceite. Se não houver outra autorização válida, o acesso será removido.'
                                        : 'Li e concordo com o termo e autorizo o acesso deste visitante.'}
                                </Label>
                            </div>
                            {error && (
                                <p
                                    role="alert"
                                    className="text-destructive text-sm"
                                >
                                    {error}
                                </p>
                            )}
                            <Button
                                type="submit"
                                variant={canRevoke ? 'destructive' : 'default'}
                                disabled={
                                    pending ||
                                    !cpf ||
                                    (!canRevoke &&
                                        (!preview.hasPhoto || !photoReady)) ||
                                    !(canRevoke ? confirmRevoke : agreed)
                                }
                            >
                                {pending
                                    ? 'Registrando…'
                                    : canRevoke
                                      ? 'Revogar meu aceite'
                                      : 'Autorizar acesso'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </section>
    );
}
