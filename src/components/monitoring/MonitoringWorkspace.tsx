"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
    claimPanicEventAction,
    closePanicEventAction,
    releasePanicEventAction,
} from "@/app/monitoring/actions";
import { MonitoringMap } from "@/components/monitoring/MonitoringMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMonitoringSocket } from "@/hooks/use-monitoring-socket";
import type { PanicEventItem } from "@/types/panic-events";
import type { ClientMapPoint } from "@/types/client-map-point";

function playAlertTone() {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 880;
        gain.gain.value = 0.08;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } catch {
        /* ignore */
    }
}

type MonitoringWorkspaceProps = {
    initialEvents: PanicEventItem[];
    initialClients: ClientMapPoint[];
};

export function MonitoringWorkspace({
    initialEvents,
    initialClients,
}: MonitoringWorkspaceProps) {
    const { data: session } = useSession();
    const token = session?.accessToken as string | undefined;
    const {
        connected,
        connectionError,
        onlineCount,
        events,
        replaceEvents,
        upsertEvent,
    } = useMonitoringSocket(token);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<
        "all" | PanicEventItem["status"]
    >("all");
    const [closeOpen, setCloseOpen] = useState(false);
    const [closingReason, setClosingReason] = useState("resolved");
    const [closingNotes, setClosingNotes] = useState("");
    const [pending, setPending] = useState(false);
    const knownIdsRef = useRef(
        new Set(initialEvents.map((event) => event.id)),
    );

    useEffect(() => {
        replaceEvents(initialEvents);
        for (const event of initialEvents) {
            knownIdsRef.current.add(event.id);
        }
    }, [initialEvents, replaceEvents]);

    useEffect(() => {
        for (const event of events) {
            if (
                !knownIdsRef.current.has(event.id) &&
                event.status === "open"
            ) {
                playAlertTone();
                toast.error(`Novo pedido de socorro: ${event.requesterName}`);
                if (typeof Notification !== "undefined") {
                    if (Notification.permission === "granted") {
                        new Notification("Pedido de socorro", {
                            body: `${event.requesterName} — ${event.clientName}`,
                        });
                    } else if (Notification.permission === "default") {
                        void Notification.requestPermission();
                    }
                }
            }
            knownIdsRef.current.add(event.id);
        }
    }, [events]);

    const filtered = useMemo(() => {
        if (statusFilter === "all") return events;
        return events.filter((e) => e.status === statusFilter);
    }, [events, statusFilter]);

    const selected = useMemo(
        () => events.find((e) => e.id === selectedId) ?? null,
        [events, selectedId],
    );

    const runAction = useCallback(
        async (
            action: "claim" | "release" | "close",
            eventId: string,
            extra?: { closingReason: string; closingNotes?: string },
        ) => {
            setPending(true);
            try {
                const result =
                    action === "claim"
                        ? await claimPanicEventAction(eventId)
                        : action === "release"
                          ? await releasePanicEventAction(eventId)
                          : await closePanicEventAction(eventId, extra!);

                if (!result.ok) {
                    toast.error(result.error);
                    return;
                }
                upsertEvent(result.data);
                toast.success(
                    action === "claim"
                        ? "Evento em tratativa."
                        : action === "release"
                          ? "Evento liberado."
                          : "Evento fechado.",
                );
                if (action === "close") setCloseOpen(false);
            } finally {
                setPending(false);
            }
        },
        [upsertEvent],
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden">
            <div className="relative min-w-0 flex-1">
                <MonitoringMap
                    events={filtered}
                    clients={initialClients}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                />
                <div className="bg-background/90 absolute top-3 left-3 rounded-md border px-3 py-2 text-xs shadow">
                    <div>
                        Socket:{" "}
                        <span
                            className={
                                connected ? "text-green-600" : "text-red-600"
                            }
                        >
                            {connected ? "conectado" : "desconectado"}
                        </span>
                    </div>
                    <div>Operadores online: {onlineCount}</div>
                    {connectionError ? (
                        <div className="text-destructive">{connectionError}</div>
                    ) : null}
                </div>
            </div>

            <aside className="bg-background flex w-[380px] shrink-0 flex-col border-l">
                <div className="space-y-2 border-b p-4">
                    <h2 className="text-lg font-bold">Monitoramento</h2>
                    <div className="flex flex-wrap gap-2">
                        {(["all", "open", "claimed", "closed"] as const).map(
                            (s) => (
                                <Button
                                    key={s}
                                    size="sm"
                                    variant={
                                        statusFilter === s
                                            ? "default"
                                            : "outline"
                                    }
                                    onClick={() => setStatusFilter(s)}
                                >
                                    {s === "all"
                                        ? "Todos"
                                        : s === "open"
                                          ? "Abertos"
                                          : s === "claimed"
                                            ? "Em tratativa"
                                            : "Fechados"}
                                </Button>
                            ),
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {filtered.length === 0 ? (
                        <p className="text-muted-foreground p-4 text-sm">
                            Nenhum evento neste filtro.
                        </p>
                    ) : (
                        filtered.map((event) => (
                            <button
                                key={event.id}
                                type="button"
                                onClick={() => setSelectedId(event.id)}
                                className={`mb-2 w-full rounded-lg border p-3 text-left ${
                                    selectedId === event.id
                                        ? "border-brand-turquoise bg-muted/40"
                                        : "hover:bg-muted/30"
                                }`}
                            >
                                <div className="mb-1 flex items-center justify-between gap-2">
                                    <span className="font-semibold">
                                        {event.requesterName}
                                    </span>
                                    <Badge
                                        variant={
                                            event.status === "open"
                                                ? "destructive"
                                                : "secondary"
                                        }
                                    >
                                        {event.status}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground text-xs">
                                    {event.clientName}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {new Date(
                                        event.receivedAt,
                                    ).toLocaleString("pt-BR")}
                                </p>
                            </button>
                        ))
                    )}
                </div>

                {selected ? (
                    <div className="space-y-2 border-t p-4">
                        <p className="text-sm font-semibold">
                            {selected.requesterName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            {selected.location.latitude.toFixed(5)},{" "}
                            {selected.location.longitude.toFixed(5)}
                        </p>
                        {selected.status === "open" ? (
                            <Button
                                className="w-full"
                                disabled={pending}
                                onClick={() =>
                                    void runAction("claim", selected.id)
                                }
                            >
                                Pegar evento
                            </Button>
                        ) : null}
                        {selected.status === "claimed" ? (
                            <>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    disabled={pending}
                                    onClick={() =>
                                        void runAction("release", selected.id)
                                    }
                                >
                                    Soltar
                                </Button>
                                <Button
                                    className="w-full"
                                    disabled={pending}
                                    onClick={() => setCloseOpen(true)}
                                >
                                    Fechar
                                </Button>
                            </>
                        ) : null}
                    </div>
                ) : null}
            </aside>

            <Sheet open={closeOpen} onOpenChange={setCloseOpen}>
                <SheetContent>
                    <SheetHeader>
                        <SheetTitle>Fechar evento</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 space-y-3">
                        <div className="space-y-2">
                            <Label htmlFor="closing-reason">Motivo</Label>
                            <select
                                id="closing-reason"
                                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                                value={closingReason}
                                onChange={(e) =>
                                    setClosingReason(e.target.value)
                                }
                            >
                                <option value="resolved">Resolvido</option>
                                <option value="false_alarm">Falso alarme</option>
                                <option value="duplicate">Duplicado</option>
                                <option value="other">Outro</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="closing-notes">Observações</Label>
                            <Input
                                id="closing-notes"
                                value={closingNotes}
                                onChange={(e) =>
                                    setClosingNotes(e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <SheetFooter className="mt-6">
                        <Button
                            disabled={pending || !selected}
                            onClick={() => {
                                if (!selected) return;
                                void runAction("close", selected.id, {
                                    closingReason,
                                    closingNotes: closingNotes || undefined,
                                });
                            }}
                        >
                            Confirmar fechamento
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
