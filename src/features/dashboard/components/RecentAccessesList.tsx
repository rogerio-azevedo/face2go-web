import Link from "next/link";

import type { ClientDashboardAccess } from "@/features/dashboard/types";
import { cn } from "@/lib/utils";

function formatDateTime(iso: string, offsetMinutes: number): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
    return new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(shifted);
}

export function RecentAccessesList({
    items,
    timezoneOffsetMinutes,
}: {
    items: ClientDashboardAccess[];
    timezoneOffsetMinutes: number;
}) {
    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-muted-foreground">
                    Últimos acessos
                </h2>
                <Link
                    href="/client/acessos"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                    Ver todos
                </Link>
            </div>
            {items.length === 0 ? (
                <p className="rounded-xl bg-card px-4 py-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
                    Nenhum acesso registrado ainda.
                </p>
            ) : (
                <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                    {items.map((item) => {
                        const denied = item.status === "denied";
                        return (
                            <li
                                key={item.id}
                                className="flex items-center justify-between gap-3 px-4 py-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-medium">
                                        {item.personName?.trim() ||
                                            "Pessoa não identificada"}
                                    </p>
                                    <p className="truncate text-sm text-muted-foreground">
                                        {item.readerName}
                                        {" · "}
                                        {formatDateTime(
                                            item.createdAt,
                                            timezoneOffsetMinutes,
                                        )}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                                        denied
                                            ? "bg-destructive/10 text-destructive"
                                            : "bg-muted text-foreground",
                                    )}
                                >
                                    {denied ? "Negado" : "Liberado"}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
