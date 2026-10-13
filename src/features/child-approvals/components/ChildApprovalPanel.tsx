'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { childApprovalHistory, manageChildApproval } from '../actions';
import type { ChildApprovalTarget } from '../types';
import type { ClientRegistrationListRow } from '@/types/domain';
import { invalidateRegistrationsList } from '@/features/registrations/hooks/use-registrations-list';
import { ChildApprovalBadge } from './ChildApprovalBadge';

type Operation = { kind: 'regularize' } | { kind: 'revoke'; consentId: string };

export function ChildApprovalPanel({
    target,
    row,
    isAdmin,
    onChanged,
}: {
    target: ChildApprovalTarget;
    row: ClientRegistrationListRow;
    isAdmin: boolean;
    onChanged: () => void;
}) {
    const queryClient = useQueryClient();
    const key = [
        'child-approvals',
        target.variant,
        target.companyClientId ?? 'self',
        target.registrationId,
    ];
    const [confirm, setConfirm] = useState<Operation | null>(null);
    const [reason, setReason] = useState('');
    const history = useQuery({
        queryKey: key,
        queryFn: async () => {
            const result = await childApprovalHistory(target);
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
    });
    const mutation = useMutation({
        mutationFn: async (operation: 'resend' | Operation) => {
            const result =
                operation === 'resend'
                    ? await manageChildApproval(target, 'resend')
                    : await manageChildApproval(
                          target,
                          operation.kind,
                          operation.kind === 'revoke'
                              ? operation.consentId
                              : undefined,
                          reason,
                      );
            if (!result.ok) throw new Error(result.error);
            return result.data;
        },
        onSuccess: async (data) => {
            toast.success(data.message);
            setConfirm(null);
            setReason('');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: key }),
                invalidateRegistrationsList(
                    queryClient,
                    target.variant,
                    target.companyClientId,
                ),
                queryClient.invalidateQueries({
                    queryKey: ['registration-events'],
                }),
            ]);
            onChanged();
        },
        onError: (error) => toast.error(error.message),
    });
    const summary = history.data?.summary ?? row;
    return (
        <section className="space-y-4 border-t pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">Autorizações do menor</h3>
                <ChildApprovalBadge row={summary} />
            </div>
            {history.isPending && (
                <p className="text-muted-foreground text-sm" role="status">
                    Carregando autorizações…
                </p>
            )}
            {history.isError && (
                <div role="alert">
                    <p className="text-destructive text-sm">
                        {history.error.message}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => history.refetch()}
                    >
                        Tentar novamente
                    </Button>
                </div>
            )}
            {summary.childApprovalStatus === 'pending' && (
                <p className="text-sm">
                    O acesso depende do aceite de outro adulto aprovado da mesma
                    unidade.{' '}
                    {summary.childApprovalRequested
                        ? 'A aprovação será concluída automaticamente após o aceite.'
                        : 'Inicie a aprovação para concluir o cadastro após o aceite.'}
                </p>
            )}
            {summary.childApprovalRemovalPending && (
                <p className="text-muted-foreground text-sm" role="status">
                    Remoção em processamento nos leitores. As falhas serão
                    tentadas novamente.
                </p>
            )}
            {history.data && (
                <>
                    {history.data.consents.length === 0 && (
                        <p className="text-muted-foreground text-sm">
                            Nenhum aceite registrado.
                        </p>
                    )}
                    {history.data.consents.map((consent) => (
                        <article
                            key={consent.id}
                            className="space-y-2 rounded-lg border p-3 text-sm"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-medium">
                                        {consent.adultSnapshot.name}
                                    </p>
                                    <p className="text-muted-foreground">
                                        Bloco{' '}
                                        {consent.adultSnapshot.block ?? '—'},
                                        unidade{' '}
                                        {consent.adultSnapshot.unit ?? '—'}
                                    </p>
                                    <p>
                                        Aceite em{' '}
                                        {new Date(
                                            consent.acceptedAt,
                                        ).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                {!consent.revokedAt &&
                                    isAdmin &&
                                    target.variant === 'client' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={mutation.isPending}
                                            onClick={() =>
                                                setConfirm({
                                                    kind: 'revoke',
                                                    consentId: consent.id,
                                                })
                                            }
                                        >
                                            Revogar
                                        </Button>
                                    )}
                            </div>
                            {consent.revokedAt && (
                                <p className="text-muted-foreground">
                                    Revogado em{' '}
                                    {new Date(consent.revokedAt).toLocaleString(
                                        'pt-BR',
                                    )}{' '}
                                    · {consent.revocationReason}
                                </p>
                            )}
                            <details>
                                <summary className="cursor-pointer font-medium">
                                    Termo aceito · {consent.termVersion}
                                </summary>
                                <p className="mt-2 whitespace-pre-wrap leading-relaxed">
                                    {consent.termContent}
                                </p>
                            </details>
                        </article>
                    ))}
                    {history.data.requests
                        .filter(
                            (request) => !request.accepted && !request.canceled,
                        )
                        .map((request) => (
                            <p
                                key={request.id}
                                className="text-muted-foreground text-sm"
                            >
                                {request.adultName}:{' '}
                                {request.emailError ??
                                    (request.emailSentAt
                                        ? `solicitação enviada em ${new Date(request.emailSentAt).toLocaleString('pt-BR')}`
                                        : 'aguardando envio')}
                                .
                            </p>
                        ))}
                </>
            )}
            <div className="flex flex-wrap gap-2">
                {summary.childApprovalStatus === 'pending' &&
                    (row.status !== 'rejected' ||
                        summary.childApprovalRequested) && (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate('resend')}
                        >
                            Reenviar solicitações
                        </Button>
                    )}
                {isAdmin &&
                    summary.enableChildApprove &&
                    row.isMinor &&
                    row.isActive &&
                    row.status === 'approved' &&
                    !summary.childApprovalRequired && (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={mutation.isPending}
                            onClick={() => setConfirm({ kind: 'regularize' })}
                        >
                            Regularizar cadastro legado
                        </Button>
                    )}
            </div>
            <AlertDialog
                open={confirm != null}
                onOpenChange={(open) => {
                    if (!open && !mutation.isPending) setConfirm(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirm?.kind === 'regularize'
                                ? 'Regularizar este menor?'
                                : 'Revogar este aceite?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirm?.kind === 'regularize'
                                ? 'O cadastro voltará para rejeitados e a face será removida dos leitores. Em seguida, inicie a reaprovação para solicitar autorização aos adultos da mesma unidade.'
                                : 'Se não houver outro aceite válido, a face será removida dos leitores. O histórico será preservado.'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {confirm?.kind === 'revoke' && (
                        <div className="space-y-2">
                            <Label htmlFor="revoke-reason">
                                Motivo da revogação
                            </Label>
                            <textarea
                                className="border-input bg-background w-full rounded-md border p-3 text-sm"
                                id="revoke-reason"
                                maxLength={500}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={mutation.isPending}>
                            Cancelar
                        </AlertDialogCancel>
                        <Button
                            variant="destructive"
                            disabled={
                                mutation.isPending ||
                                (confirm?.kind === 'revoke' &&
                                    reason.trim().length < 3)
                            }
                            onClick={() => confirm && mutation.mutate(confirm)}
                        >
                            {mutation.isPending ? 'Registrando…' : 'Confirmar'}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </section>
    );
}
