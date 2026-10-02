import { DoorOpen, History, Link2, UserCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type Action = {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    badge?: string;
};

export function QuickActions({
    pendingCount,
    canManageReaders,
}: {
    pendingCount: number;
    canManageReaders: boolean;
}) {
    const actions: Action[] = [
        {
            title: "Aprovar cadastros",
            description: "Liberar quem está esperando",
            href: "/client/cadastros",
            icon: UserCheck,
            badge: pendingCount > 0 ? String(pendingCount) : undefined,
        },
        {
            title: "Convidar pessoas",
            description: "Link ou QR de cadastro",
            href: "/client/cadastros?view=links",
            icon: Link2,
        },
        {
            title: "Ver acessos",
            description: "Quem entrou e saiu",
            href: "/client/acessos",
            icon: History,
        },
    ];
    if (canManageReaders) {
        actions.push({
            title: "Leitores",
            description: "Portas e conexão",
            href: "/client/leitores",
            icon: DoorOpen,
        });
    }

    return (
        <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
                O que você pode fazer
            </h2>
            <ul className="grid grid-cols-2 gap-3">
                {actions.map((action) => (
                    <li key={action.href}>
                        <Link
                            href={action.href}
                            className="flex h-full min-h-24 flex-col justify-between gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <span className="flex items-center justify-between gap-2">
                                <action.icon
                                    className="size-5 text-foreground"
                                    aria-hidden
                                />
                                {action.badge ? (
                                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                                        {action.badge}
                                    </span>
                                ) : null}
                            </span>
                            <span>
                                <span className="block text-sm font-semibold">
                                    {action.title}
                                </span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                    {action.description}
                                </span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}
