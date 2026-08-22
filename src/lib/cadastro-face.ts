/** Limite alinhado ao multer nos endpoints públicos de upload-photo. */
export const MAX_FACE_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Converte data URL (preview local) em Blob para upload multipart, sem redimensionar.
 */
export async function dataUrlToUploadBlob(dataUrl: string): Promise<Blob> {
    const trimmed = dataUrl.trim();
    const normalized = trimmed.startsWith("data:")
        ? trimmed
        : `data:image/jpeg;base64,${trimmed}`;
    return fetch(normalized).then((r) => r.blob());
}

/** Em contexto não seguro, prefere input com capture. No mobile, usamos o custom UI com máscara. */
export function preferNativeCameraInput(): boolean {
    if (typeof window === "undefined") return false;
    if (!window.isSecureContext) return true;
    // Removido o isMobileTouchDevice() para que o mobile também use a moldura oval (getUserMedia)
    return false;
}
