'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { ClientSystemUserRow } from '@/app/client/equipe/actions';

import type { TelegramChatRow, TelegramLink } from '../actions';
import {
    LinkGroupDialog,
    LinkUserDialog,
    PendingTelegramLink,
} from './link-dialogs';
import {
    useDeleteTelegramChat,
    useSetTelegramChatActive,
    useTelegramAlerts,
} from '../use-telegram-alerts';

const CHAT_TYPE_LABEL: Record<TelegramChatRow['chatType'], string> = {
    private: 'Usuário',
    group: 'Grupo',
    supergroup: 'Grupo',
};

function chatLabel(chat: TelegramChatRow) {
    if (chat.chatType === 'private') {
        return chat.userName?.trim() || chat.userEmail || chat.title || 'Usuário';
    }
    return chat.title?.trim() || 'Grupo';
}

export function TelegramAlertsPanel({
    clientId,
    users,
}: {
    clientId: string;
    users: ClientSystemUserRow[];
}) {
    const [pending, setPending] = useState<TelegramLink | null>(null);
    const [userOpen, setUserOpen] = useState(false);
    const [groupOpen, setGroupOpen] = useState(false);
    const alerts = useTelegramAlerts(clientId, pending !== null);
    const setActive = useSetTelegramChatActive(clientId);
    const remove = useDeleteTelegramChat(clientId);
    const chats = alerts.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={() => setUserOpen(true)}>
                    Vincular usuário
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGroupOpen(true)}
                >
                    Vincular grupo
                </Button>
            </div>

            {pending ? (
                <PendingTelegramLink
                    link={pending}
                    onDismiss={() => setPending(null)}
                />
            ) : null}

            {alerts.isError ? (
                <p className="text-destructive text-sm">
                    {alerts.error instanceof Error
                        ? alerts.error.message
                        : 'Não foi possível carregar os alertas.'}
                </p>
            ) : null}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Destino</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ativo</TableHead>
                        <TableHead className="w-12" />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {chats.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={4}
                                className="text-muted-foreground py-8 text-center"
                            >
                                Nenhum chat vinculado.
                            </TableCell>
                        </TableRow>
                    ) : (
                        chats.map((chat) => (
                            <TableRow key={chat.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{chatLabel(chat)}</span>
                                        {chat.username ? (
                                            <span className="text-muted-foreground text-xs">
                                                @{chat.username}
                                            </span>
                                        ) : null}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {CHAT_TYPE_LABEL[chat.chatType]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={chat.isActive}
                                        disabled={setActive.isPending}
                                        onCheckedChange={(value) =>
                                            setActive.mutate({
                                                id: chat.id,
                                                isActive: value === true,
                                            })
                                        }
                                        aria-label={`Alertas de ${chatLabel(chat)}`}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={remove.isPending}
                                        aria-label={`Remover ${chatLabel(chat)}`}
                                        onClick={() => remove.mutate(chat.id)}
                                    >
                                        <Trash2 />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <LinkUserDialog
                open={userOpen}
                onOpenChange={setUserOpen}
                users={users}
                onLinked={setPending}
            />
            <LinkGroupDialog
                open={groupOpen}
                onOpenChange={setGroupOpen}
                onLinked={setPending}
            />
        </div>
    );
}
