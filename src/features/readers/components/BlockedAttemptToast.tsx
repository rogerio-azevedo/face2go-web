"use client";

import { Ban, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { BlockedAttemptSocketPayload } from "@/hooks/use-blocked-attempt-socket";

const PERSON_TYPE_LABEL: Record<string, string> = {
    student: "Aluno",
    responsible: "Responsável",
    member: "Membro",
    guest: "Visitante",
};

function formatWhen(value: string | Date | null) {
    if (!value) return "Agora";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "Agora";
    return date.toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
    });
}

function directionLabel(direction: "in" | "out" | null) {
    if (direction === "in") return "Entrada";
    if (direction === "out") return "Saída";
    return null;
}

export function BlockedAttemptToast({
    toastId,
    event,
}: {
    toastId: string | number;
    event: BlockedAttemptSocketPayload;
}) {
    const name = event.personName?.trim() || "Pessoa bloqueada";
    const kind = event.personType
        ? PERSON_TYPE_LABEL[event.personType]
        : null;
    const direction = directionLabel(event.readerDirection);
    const readerLine = [event.readerName, direction].filter(Boolean).join(" · ");

    return (
        <div className="border-destructive/30 bg-background text-foreground flex w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-lg">
            <div className="bg-muted relative size-24 shrink-0 overflow-hidden">
                {event.snapUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- captura temporária do leitor
                    <img
                        src={event.snapUrl}
                        alt={`Captura de ${name}`}
                        className="absolute inset-0 size-full object-cover"
                    />
                ) : (
                    <div className="text-destructive flex size-full items-center justify-center">
                        <Ban className="size-8" />
                    </div>
                )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                    <p className="text-destructive text-xs font-semibold tracking-wide uppercase">
                        Tentativa bloqueada
                    </p>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground -mt-1 -mr-1 size-7"
                        onClick={() => toast.dismiss(toastId)}
                        aria-label="Fechar alerta"
                    >
                        <X className="size-4" />
                    </Button>
                </div>
                <p className="truncate text-sm font-medium">{name}</p>
                {kind ? (
                    <p className="text-muted-foreground truncate text-xs">{kind}</p>
                ) : null}
                <p className="text-muted-foreground truncate text-xs">
                    {readerLine}
                </p>
                {event.blockReason ? (
                    <p className="line-clamp-2 text-xs">
                        Motivo: {event.blockReason}
                    </p>
                ) : null}
                <p className="text-muted-foreground text-[11px]">
                    {formatWhen(event.eventDate)}
                    {event.clientName ? ` · ${event.clientName}` : ""}
                </p>
            </div>
        </div>
    );
}
