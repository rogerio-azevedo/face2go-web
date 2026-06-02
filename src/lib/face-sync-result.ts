export type FaceSyncOutcome = "success" | "partial" | "failed";

export function parseFaceSyncOutcome(
    status: string,
    error: string | null,
): FaceSyncOutcome {
    if (status === "synced" && error === null) return "success";
    if (status === "synced" && isPartialSyncError(error)) return "partial";
    return "failed";
}

export function isPartialSyncError(error: string | null | undefined): boolean {
    return error?.toLowerCase().includes("parcialmente") ?? false;
}

/** Remove ruído técnico de mensagens gravadas pelo backend. */
export function humanizeDeviceSyncError(
    detail: string | null | undefined,
): string {
    if (detail == null || detail.trim() === "") {
        return "Não foi possível sincronizar com os leitores.";
    }

    let t = detail
        .replace(/\bRequest failed with status code 400\b/gi, "")
        .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{2,5})?\b/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

    if (/timeout|timed out|offline|inacessível|inacessivel|econnrefused|etimedout/i.test(t)) {
        return "Um ou mais leitores estão offline ou inacessíveis no momento.";
    }

    return t || "Não foi possível sincronizar com os leitores.";
}

export const FACE_SYNC_STEPS = [
    "Verificando foto…",
    "Enviando zona de horário aos leitores…",
    "Atualizando cartão de acesso…",
    "Enviando foto facial…",
] as const;
