import type { ClientRegistrationListRow } from "@/types/domain";

export type RegistrationListTab =
    | "draft"
    | "approved"
    | "rejected"
    | "blocked"
    | "deleted";

export type RegistrationSortField = "submittedAt" | "name" | "local";
export type RegistrationSortDir = "asc" | "desc";

export const REGISTRATION_TAB_LABELS: Record<RegistrationListTab, string> = {
    draft: "Aguardando aprovação",
    approved: "Aprovados",
    rejected: "Rejeitados",
    blocked: "Bloqueados",
    deleted: "Excluídos",
};

export function parseRegistrationListTab(
    value: string | undefined,
): RegistrationListTab | undefined {
    return value && value in REGISTRATION_TAB_LABELS
        ? (value as RegistrationListTab)
        : undefined;
}

export function formatWhen(iso: string | null) {
    if (!iso) return "—";
    try {
        return new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
        }).format(new Date(iso));
    } catch {
        return iso;
    }
}

/** YYYY-MM-DD → DD/MM/AAAA, sem Date() para evitar deslocamento de fuso. */
export function formatBirthDate(iso: string | null) {
    if (!iso) return "—";
    const [year, month, day] = iso.slice(0, 10).split("-");
    if (!year || !month || !day) return iso;
    return `${day}/${month}/${year}`;
}

/** "há 5 min", "há 2 h", "há 3 d"; datas longas caem no formato absoluto. */
export function formatRelativeWhen(iso: string | null) {
    if (!iso) return "—";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return iso;
    const minutes = Math.round((Date.now() - then) / 60_000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `há ${hours} h`;
    const days = Math.round(hours / 24);
    if (days < 30) return `há ${days} d`;
    return formatWhen(iso);
}

export function extraSummary(row: ClientRegistrationListRow): string {
    const data = row.additionalData;
    if (!data || typeof data !== "object") return "—";
    if ("block" in data && "unit" in data) {
        return `Bloco ${String(data.block)} · Unid. ${String(data.unit)}`;
    }
    if ("room" in data) {
        return `Sala ${String(data.room)}`;
    }
    return "—";
}

export function registrationStatusLabel(
    status: ClientRegistrationListRow["status"],
) {
    if (status === "draft") return "Aguardando";
    if (status === "approved") return "Aprovado";
    if (status === "blocked") return "Bloqueado";
    return "Rejeitado";
}

/** Dígitos prontos para wa.me / tel:, com DDI 55. */
export function toBrazilContactNumber(phone: string | null): string | null {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) return `55${digits}`;
    if (
        (digits.length === 12 || digits.length === 13) &&
        digits.startsWith("55")
    ) {
        return digits;
    }
    return null;
}

export function compareRegistrationRows(
    a: ClientRegistrationListRow,
    b: ClientRegistrationListRow,
    field: RegistrationSortField,
    dir: RegistrationSortDir,
): number {
    let cmp = 0;
    if (field === "name") {
        cmp = (a.name ?? "").localeCompare(b.name ?? "", "pt-BR", {
            sensitivity: "base",
        });
    } else if (field === "local") {
        cmp = extraSummary(a).localeCompare(extraSummary(b), "pt-BR", {
            sensitivity: "base",
        });
    } else {
        const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        cmp = ta - tb;
    }
    return dir === "asc" ? cmp : -cmp;
}
