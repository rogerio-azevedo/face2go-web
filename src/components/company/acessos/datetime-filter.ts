/** Valor aceito por `<input type="datetime-local">` (`YYYY-MM-DDTHH:mm`). */
export function toDatetimeLocalInputValue(
    value: string,
    bound: "start" | "end",
): string {
    const raw = value.trim();
    if (!raw) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return bound === "end" ? `${raw}T23:59` : `${raw}T00:00`;
    }
    const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/.exec(raw);
    if (match) {
        return `${match[1]}T${match[2]}`;
    }
    return raw.slice(0, 16);
}
