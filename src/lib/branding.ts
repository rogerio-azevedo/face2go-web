const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6})$/;

export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
    const match = HEX_COLOR_REGEX.exec(hex.trim());
    if (!match) return null;
    const value = match[1]!;
    return {
        r: parseInt(value.slice(0, 2), 16),
        g: parseInt(value.slice(2, 4), 16),
        b: parseInt(value.slice(4, 6), 16),
    };
}

/** Texto claro ou escuro com base na luminância da cor primária (mesma lógica do app mobile). */
export function contrastTextColor(hex: string, fallback = "#ffffff"): string {
    const rgb = parseHexColor(hex);
    if (!rgb) return fallback;
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.6 ? "#101010" : "#ffffff";
}

export function isValidHttpUrl(url: string | undefined | null): boolean {
    if (!url?.trim()) return false;
    return /^https?:\/\/[^\s]+$/.test(url.trim());
}

export function resolvePrimaryColor(
    value: string | undefined | null,
    fallback = "#00c7b7",
): string {
    const trimmed = value?.trim();
    if (trimmed && parseHexColor(trimmed)) return trimmed;
    return fallback;
}
