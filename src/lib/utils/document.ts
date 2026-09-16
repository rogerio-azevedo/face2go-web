/** Tamanho máximo do CPF formatado: 000.000.000-00 */
export const CPF_FORMATTED_MAX_LENGTH = 14;

/** Tamanho máximo do CNPJ formatado: 00.000.000/0000-00 */
export const CNPJ_FORMATTED_MAX_LENGTH = 18;

/** Remove caracteres não numéricos. */
export function onlyDigits(value: string): string {
    return value.replace(/\D/g, "");
}

/** Remove caracteres não numéricos do CPF. */
export function normalizeCpf(value: string): string {
    return onlyDigits(value);
}

function allSameDigits(digits: string): boolean {
    return digits.length > 0 && /^(\d)\1+$/.test(digits);
}

function mod11CheckDigit(digits: string, weights: number[]): number {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
        sum += Number(digits[i]) * (weights[i] ?? 0);
    }
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
}

/** CPF com 11 dígitos e dígitos verificadores válidos. */
export function isValidCpf(value: string): boolean {
    const digits = onlyDigits(value);
    if (digits.length !== 11 || allSameDigits(digits)) return false;
    const d1 = mod11CheckDigit(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (d1 !== Number(digits[9])) return false;
    const d2 = mod11CheckDigit(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    return d2 === Number(digits[10]);
}

/** CNPJ com 14 dígitos e dígitos verificadores válidos. */
export function isValidCnpj(value: string): boolean {
    const digits = onlyDigits(value);
    if (digits.length !== 14 || allSameDigits(digits)) return false;
    const d1 = mod11CheckDigit(
        digits,
        [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    if (d1 !== Number(digits[12])) return false;
    const d2 = mod11CheckDigit(
        digits,
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    return d2 === Number(digits[13]);
}

export function isValidCpfOrCnpj(value: string): boolean {
    const digits = onlyDigits(value);
    if (digits.length === 11) return isValidCpf(digits);
    if (digits.length === 14) return isValidCnpj(digits);
    return false;
}

/** Formata CPF como XXX.XXX.XXX-XX (máx. 11 dígitos). */
export function formatCpf(value: string): string {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Formata CNPJ como XX.XXX.XXX/XXXX-XX (máx. 14 dígitos). */
export function formatCnpj(value: string): string {
    const digits = onlyDigits(value).slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    }
    if (digits.length <= 12) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function formatCpfOrCnpj(value: string): string {
    const digits = onlyDigits(value);
    if (digits.length <= 11) return formatCpf(digits);
    return formatCnpj(digits);
}

/** Aplica máscara de CPF a partir do texto digitado (só dígitos, máx. 11). */
export function applyCpfMaskInput(text: string): string {
    return formatCpf(text.replace(/\D/g, "").slice(0, 11));
}

/** Aplica máscara de CNPJ a partir do texto digitado (só dígitos, máx. 14). */
export function applyCnpjMaskInput(text: string): string {
    return formatCnpj(text.replace(/\D/g, "").slice(0, 14));
}

/** Máscara dinâmica: até 11 dígitos formata CPF; acima, CNPJ. */
export function applyCpfCnpjMaskInput(text: string): string {
    const digits = text.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 11) return formatCpf(digits);
    return formatCnpj(digits);
}
