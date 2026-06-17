/**
 * Normaliza texto para comparação em buscas: remove acentos e ignora maiúsculas/minúsculas.
 */
export function normalizeSearch(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}
