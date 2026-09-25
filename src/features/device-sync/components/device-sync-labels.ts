import type {
    DeviceSyncJobKind,
    DeviceSyncJobStatus,
} from "@/features/device-sync/types";

export const JOB_KIND_LABEL: Record<DeviceSyncJobKind, string> = {
    "face.person": "Face",
    "face.reader": "Leitor (todos)",
    "face.school": "Lote escolar",
    "lpr.vehicle": "Placa",
    "lpr.camera": "Câmera (todas)",
};

export const JOB_STATUS_LABEL: Record<DeviceSyncJobStatus, string> = {
    queued: "Na fila",
    running: "Em execução",
    done: "Concluído",
    failed: "Falhou",
    canceled: "Cancelado",
};

export const JOB_STATUS_VARIANT: Record<
    DeviceSyncJobStatus,
    "default" | "secondary" | "destructive" | "outline"
> = {
    queued: "secondary",
    running: "default",
    done: "outline",
    failed: "destructive",
    canceled: "outline",
};

const dateTime = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
});

export function formatJobTime(value: string | null): string {
    return value ? dateTime.format(new Date(value)) : "—";
}
