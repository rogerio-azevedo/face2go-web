import { DashboardStatsCard } from "@/components/shared/DashboardStatsCard";
import type { ClientKpiItem } from "@/features/dashboard/lib/client-kpis";

export function ClientKpis({ items }: { items: ClientKpiItem[] }) {
    return (
        <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
                Números da unidade
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                    <li key={item.title}>
                        <DashboardStatsCard {...item} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
