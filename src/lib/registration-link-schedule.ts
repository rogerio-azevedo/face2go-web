export type CreateRegistrationLinkBody =
    | { kind: "permanent" }
    | { kind: "temporary"; validFrom: string; validUntil: string };

/** Formata Date para valor de input datetime-local (YYYY-MM-DDTHH:mm) no horário local. */
export function toDatetimeLocalValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Sugestão ao escolher “temporário”: hoje 00:00 → hoje 23:59 (ajustável pelo usuário). */
export function defaultTemporaryVigenciaLocal(): { from: string; until: string } {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 0, 0);
    return {
        from: toDatetimeLocalValue(start),
        until: toDatetimeLocalValue(end),
    };
}

/**
 * Converte valores de input datetime-local (YYYY-MM-DDTHH:mm, fuso do navegador) em ISO UTC.
 */
export function localDateTimeRangeToIso(
    fromLocal: string,
    untilLocal: string,
): { validFrom: string; validUntil: string } {
    const a = fromLocal.trim();
    const b = untilLocal.trim();
    if (!a || !b) {
        throw new Error("Informe início e fim da vigência.");
    }
    const from = new Date(a);
    const until = new Date(b);
    if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime())) {
        throw new Error("Datas inválidas.");
    }
    if (from.getTime() > until.getTime()) {
        throw new Error("O fim da vigência deve ser igual ou posterior ao início.");
    }
    return { validFrom: from.toISOString(), validUntil: until.toISOString() };
}

function fmtDateTime(iso: string | null): string {
    if (!iso) return "";
    try {
        return new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

/** Rótulo para tabela / lista. */
export function registrationLinkVigenciaLabel(row: {
    validFrom: string | null;
    expiresAt: string | null;
}): string {
    if (!row.validFrom && !row.expiresAt) return "Permanente";
    if (row.validFrom && row.expiresAt) {
        return `${fmtDateTime(row.validFrom)} – ${fmtDateTime(row.expiresAt)}`;
    }
    if (row.expiresAt) return `Até ${fmtDateTime(row.expiresAt)}`;
    return `A partir de ${fmtDateTime(row.validFrom)}`;
}
