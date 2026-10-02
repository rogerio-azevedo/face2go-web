/** Data civil `YYYY-MM-DD` no fuso do cliente (offset em minutos vs UTC). */
export function calendarDateInOffset(
    timezoneOffsetMinutes: number,
    now: Date = new Date(),
): string {
    const shifted = new Date(now.getTime() + timezoneOffsetMinutes * 60_000);
    const year = shifted.getUTCFullYear();
    const month = String(shifted.getUTCMonth() + 1).padStart(2, "0");
    const day = String(shifted.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
