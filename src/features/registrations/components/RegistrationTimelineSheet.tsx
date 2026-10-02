"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { History } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { addRegistrationNoteAction } from "@/features/registrations/actions/events";
import {
    registrationEventsQueryKey,
    useRegistrationEvents,
} from "@/features/registrations/hooks/use-registration-events";
import { REGISTRATION_EVENT_META } from "@/features/registrations/lib/registration-event-meta";
import { formatWhen } from "@/features/registrations/lib/registration-format";
import type { ClientRegistrationListRow } from "@/types/domain";

function NoteComposer({
    pending,
    onSubmit,
}: {
    pending: boolean;
    onSubmit: (body: string) => void;
}) {
    const [body, setBody] = useState("");
    const canSubmit = body.trim().length >= 3 && !pending;

    return (
        <form
            className="space-y-2"
            onSubmit={(event) => {
                event.preventDefault();
                if (!canSubmit) return;
                onSubmit(body);
            }}
        >
            <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-h-[88px] w-full rounded-lg border px-2.5 py-2 text-sm outline-none focus-visible:ring-3"
                placeholder="Registre um fato sobre este cadastro…"
                aria-label="Nova anotação"
                maxLength={2000}
            />
            <Button type="submit" disabled={!canSubmit}>
                {pending ? "Registrando…" : "Registrar anotação"}
            </Button>
        </form>
    );
}

export function RegistrationTimelineSheet({
    open,
    onOpenChange,
    row,
    variant,
    companyClientId,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    row: ClientRegistrationListRow | null;
    variant: "client" | "company";
    companyClientId?: string;
}) {
    const queryClient = useQueryClient();
    const [composerKey, setComposerKey] = useState(0);
    const eventsQuery = useRegistrationEvents({
        variant,
        companyClientId,
        registrationId: row?.id ?? null,
        enabled: open && row != null,
    });

    const note = useMutation({
        mutationFn: async (text: string) => {
            if (!row) throw new Error("Cadastro inválido.");
            const result = await addRegistrationNoteAction(
                variant,
                row.id,
                text,
                companyClientId,
            );
            if (!result.ok) throw new Error(result.error);
            return result.event;
        },
        onSuccess: async () => {
            setComposerKey((current) => current + 1);
            toast.success("Anotação registrada.");
            if (!row) return;
            await queryClient.invalidateQueries({
                queryKey: registrationEventsQueryKey(
                    variant,
                    companyClientId,
                    row.id,
                ),
            });
        },
        onError: (error: Error) => toast.error(error.message),
    });

    const events = eventsQuery.data ?? [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="h-dvh w-full gap-0 data-[side=right]:h-dvh data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:border-l-0 data-[side=right]:sm:max-w-xl data-[side=right]:sm:border-l"
            >
                <SheetHeader className="shrink-0 border-b">
                    <SheetTitle>Histórico</SheetTitle>
                    <SheetDescription>
                        {row?.name ?? "Cadastro"}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
                    {row ? (
                        <NoteComposer
                            key={`${row.id}-${composerKey}`}
                            pending={note.isPending}
                            onSubmit={(text) => note.mutate(text)}
                        />
                    ) : null}

                    {eventsQuery.isError ? (
                        <p className="text-destructive text-sm">
                            Não foi possível carregar o histórico.
                        </p>
                    ) : null}

                    {eventsQuery.isLoading ? (
                        <p className="text-muted-foreground text-sm">
                            Carregando histórico…
                        </p>
                    ) : null}

                    {!eventsQuery.isLoading && events.length === 0 ? (
                        <p className="text-muted-foreground flex items-center gap-2 text-sm">
                            <History className="size-4" />
                            Nenhuma ocorrência registrada.
                        </p>
                    ) : null}

                    <ol className="space-y-4">
                        {events.map((event) => {
                            const meta = REGISTRATION_EVENT_META[event.type];
                            const Icon = meta.icon;
                            return (
                                <li key={event.id} className="flex gap-3">
                                    <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                                        <Icon className="size-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium">
                                            {meta.label}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {event.authorName ?? "—"}
                                            {" · "}
                                            {formatWhen(event.createdAt)}
                                        </p>
                                        {event.body ? (
                                            <p className="mt-1 text-sm whitespace-pre-wrap">
                                                {event.body}
                                            </p>
                                        ) : null}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </SheetContent>
        </Sheet>
    );
}
