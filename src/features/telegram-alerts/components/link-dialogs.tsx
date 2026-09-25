'use client';

import { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { ClientSystemUserRow } from '@/app/client/equipe/actions';

import type { TelegramLink } from './actions';
import { useCreateTelegramLink } from './use-telegram-alerts';

function formatExpires(iso: string) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}

function copyLink(url: string) {
    void navigator.clipboard.writeText(url).then(
        () => toast.success('Link copiado.'),
        () => toast.error('Não foi possível copiar.'),
    );
}

export function LinkUserDialog({
    open,
    onOpenChange,
    users,
    onLinked,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    users: ClientSystemUserRow[];
    onLinked: (link: TelegramLink) => void;
}) {
    const [targetUserId, setTargetUserId] = useState('');
    const createLink = useCreateTelegramLink();
    const activeUsers = users.filter((user) => user.isActive);

    async function submit() {
        if (!targetUserId) {
            toast.error('Escolha um usuário da equipe.');
            return;
        }
        const link = await createLink.mutateAsync({
            kind: 'user',
            targetUserId,
        });
        onLinked(link);
        onOpenChange(false);
        setTargetUserId('');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Vincular usuário</DialogTitle>
                    <DialogDescription>
                        A pessoa abre o link no Telegram e toca em Iniciar. O
                        link vale 15 minutos e só pode ser usado uma vez.
                    </DialogDescription>
                </DialogHeader>
                <SearchableSelect
                    id="telegram-alert-user"
                    options={activeUsers.map((user) => ({
                        value: user.userId,
                        label: user.name?.trim() || user.email,
                    }))}
                    value={targetUserId}
                    onChange={setTargetUserId}
                    placeholder="Usuário da equipe"
                    noOptionsMessage="Nenhum usuário ativo"
                />
                <DialogFooter>
                    <Button
                        type="button"
                        onClick={() => void submit()}
                        disabled={createLink.isPending}
                    >
                        Gerar link
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function LinkGroupDialog({
    open,
    onOpenChange,
    onLinked,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLinked: (link: TelegramLink) => void;
}) {
    const createLink = useCreateTelegramLink();

    async function submit() {
        const link = await createLink.mutateAsync({ kind: 'group' });
        onLinked(link);
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Vincular grupo</DialogTitle>
                    <DialogDescription>
                        Abra o link, escolha o grupo e confirme. O bot precisa
                        poder enviar mensagens no grupo. O link vale 15 minutos.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        onClick={() => void submit()}
                        disabled={createLink.isPending}
                    >
                        Gerar link do grupo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function PendingTelegramLink({
    link,
    onDismiss,
}: {
    link: TelegramLink;
    onDismiss: () => void;
}) {
    const expires = formatExpires(link.expiresAt);

    return (
        <div className="bg-muted/40 flex flex-col gap-3 rounded-lg border p-4">
            <div className="space-y-1">
                <p className="text-sm font-medium">Link pendente</p>
                <p className="text-muted-foreground text-sm">
                    A lista atualiza sozinha quando o vínculo for concluído
                    {expires ? ` (expira em ${expires})` : ''}.
                </p>
            </div>
            <p className="text-sm break-all">{link.url}</p>
            <div className="flex flex-wrap gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyLink(link.url)}
                >
                    <Copy />
                    Copiar
                </Button>
                <Button type="button" variant="outline" render={<a href={link.url} target="_blank" rel="noreferrer" />}>
                    <ExternalLink />
                    Abrir
                </Button>
                <Button type="button" variant="ghost" onClick={onDismiss}>
                    Fechar
                </Button>
            </div>
        </div>
    );
}
