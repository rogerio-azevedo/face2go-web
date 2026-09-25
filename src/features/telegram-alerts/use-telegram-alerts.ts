'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
    createTelegramLinkTokenAction,
    deleteTelegramChatAction,
    listTelegramAlertsAction,
    setTelegramChatActiveAction,
    type TelegramLink,
} from './actions';

export function telegramAlertsQueryKey(clientId: string) {
    return ['telegram-alerts', clientId] as const;
}

export function useTelegramAlerts(clientId: string, poll: boolean) {
    return useQuery({
        queryKey: telegramAlertsQueryKey(clientId),
        queryFn: async () => {
            const result = await listTelegramAlertsAction();
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.chats;
        },
        refetchInterval: poll ? 4_000 : false,
    });
}

export function useCreateTelegramLink() {
    return useMutation({
        mutationFn: async (
            input:
                | { kind: 'user'; targetUserId: string }
                | { kind: 'group' },
        ): Promise<TelegramLink> => {
            const result = await createTelegramLinkTokenAction(input);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result.link;
        },
        onError: (error: Error) => toast.error(error.message),
    });
}

export function useSetTelegramChatActive(clientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (input: { id: string; isActive: boolean }) => {
            const result = await setTelegramChatActiveAction(input);
            if (!result.success) {
                throw new Error(result.error);
            }
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: telegramAlertsQueryKey(clientId),
            });
        },
        onError: (error: Error) => toast.error(error.message),
    });
}

export function useDeleteTelegramChat(clientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteTelegramChatAction(id);
            if (!result.success) {
                throw new Error(result.error);
            }
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: telegramAlertsQueryKey(clientId),
            });
        },
        onError: (error: Error) => toast.error(error.message),
    });
}
