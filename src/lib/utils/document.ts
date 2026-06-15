/** Tamanho máximo do CPF formatado: 000.000.000-00 */
export const CPF_FORMATTED_MAX_LENGTH = 14;

/** Remove caracteres não numéricos do CPF. */
export function normalizeCpf(value: string): string {
    return value.replace(/\D/g, "");
}

/** Formata CPF como XXX.XXX.XXX-XX (máx. 11 dígitos). */
export function formatCpf(value: string): string {
    const digits = normalizeCpf(value).slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Aplica máscara de CPF a partir do texto digitado (só dígitos, máx. 11). */
export function applyCpfMaskInput(text: string): string {
    return formatCpf(text.replace(/\D/g, "").slice(0, 11));
}
