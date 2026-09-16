/** Tamanho máximo da data formatada: DD/MM/AAAA */
export const BIRTH_DATE_FORMATTED_MAX_LENGTH = 10;

/** Máscara DD/MM/AAAA — apenas dígitos, máx. 8. */
export function applyBirthDateMaskInput(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Converte máscara DD/MM/AAAA para YYYY-MM-DD, ou null se incompleta/inválida. */
export function birthDateMaskToIso(masked: string): string | null {
    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return null;

    const day = Number(digits.slice(0, 2));
    const month = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4, 8));
    if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) {
        return null;
    }

    const date = new Date(year, month - 1, day);
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
}
