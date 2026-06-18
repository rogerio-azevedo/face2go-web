import type { ReactNode } from "react";

export default function MonitoringLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="bg-background min-h-screen">
            <header className="flex h-16 items-center border-b px-4">
                <div>
                    <p className="text-sm font-semibold">Central de Monitoramento</p>
                    <p className="text-muted-foreground text-xs">
                        Pedidos de socorro em tempo real
                    </p>
                </div>
            </header>
            {children}
        </div>
    );
}
