import type { ReactNode } from "react";

import { MonitoringContextSwitcher } from "@/components/monitoring/MonitoringContextSwitcher";

export default function MonitoringLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="bg-background min-h-screen">
            <header className="flex h-16 items-center justify-between gap-4 border-b px-4">
                <div className="min-w-0">
                    <p className="text-sm font-semibold">Central de Monitoramento</p>
                    <p className="text-muted-foreground text-xs">
                        Pedidos de socorro em tempo real
                    </p>
                </div>
                <MonitoringContextSwitcher />
            </header>
            {children}
        </div>
    );
}
