import { Badge } from "@/components/ui/badge";
import type { ReaderMonitorDeviceApiRow } from "@/types/domain";

export function ConnectionBadge({
    device,
    loading,
    connectionMode,
}: {
    device: ReaderMonitorDeviceApiRow | undefined;
    loading: boolean;
    connectionMode?: "direct" | "auto_register";
}) {
    const autoRegister = connectionMode === "auto_register";
    const monitorOnlineHint = autoRegister
        ? "Sessão de registro automático ativa."
        : "Monitor de eventos ativo — recebendo passagens em tempo real.";
    const monitorOfflineHint =
        device?.lastConnectionError ??
        (autoRegister
            ? "Sem sessão no gateway de registro automático."
            : "Monitor de eventos inativo — cadastro, sync e listagem ISAPI podem funcionar normalmente.");

    if (loading && !device) {
        return (
            <span className="text-muted-foreground text-sm tabular-nums">
                …
            </span>
        );
    }
    if (!device) {
        return (
            <span className="text-muted-foreground text-sm" title="Sem dados">
                —
            </span>
        );
    }
    if (!device.streamSupported) {
        const hint =
            device.lastConnectionError ??
            "Monitoramento de stream indisponível.";
        return (
            <Badge
                variant="secondary"
                className="font-normal"
                title={hint}
            >
                N/D
            </Badge>
        );
    }
    if (device.connected) {
        return (
            <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 font-normal text-emerald-800 hover:bg-emerald-50"
                title={monitorOnlineHint}
            >
                Online
            </Badge>
        );
    }
    return (
        <Badge
            variant="outline"
            className="border-red-200 bg-red-50 font-normal text-red-800 hover:bg-red-50"
            title={monitorOfflineHint}
        >
            Offline
        </Badge>
    );
}
