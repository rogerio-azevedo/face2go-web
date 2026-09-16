/** Tamanho máximo do telefone BR formatado: (00) 00000-0000 */
export const PHONE_FORMATTED_MAX_LENGTH = 15;

/** Máscara BR: fixo (XX) XXXX-XXXX ou celular (XX) XXXXX-XXXX — apenas dígitos. */
export function applyPhoneMaskInput(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length === 0) return "";

    const ddd = digits.slice(0, 2);
    const rest = digits.slice(2);

    if (digits.length <= 2) return `(${ddd}`;

    const isMobile = digits.length > 10;

    if (isMobile) {
        if (rest.length <= 5) return `(${ddd}) ${rest}`;
        return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
    }

    if (rest.length <= 4) return `(${ddd}) ${rest}`;
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
}
