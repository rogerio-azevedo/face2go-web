export function isSimilarFaceSyncError(
    error: string | null | undefined,
): boolean {
    if (!error) return false;
    const text = error.toLowerCase();
    return (
        text.includes("foto já cadastrada") ||
        text.includes("rosto já está cadastrado")
    );
}

export function collidingPersonLabel(
    error: string | null | undefined,
): string | null {
    if (!error) return null;
    const match = error.match(/Coincide com ([^.]+)\./);
    const label = match?.[1]?.trim();
    return label || null;
}
