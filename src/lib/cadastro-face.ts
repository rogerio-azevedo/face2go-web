/**
 * Limite alinhado ao leitor Intelbras e ao fluxo Meu IOT (~100 KB decodificados).
 * @see meuiot-web/src/utils/compressFaceImage.ts
 */
export const FACIAL_READER_MAX_IMAGE_BYTES = 100 * 1024;

function uint8ToBase64(bytes: Uint8Array): string {
    let binary = "";
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

/**
 * Redimensiona (máx. 400×500, como no app / Meu IOT) e comprime JPEG até caber em `maxBytes`.
 * Retorna data URL `image/jpeg` para o `upload-photo` (aceita data URL ou base64).
 */
export async function compressFaceForRegistrationUpload(
    dataUrlOrRaw: string,
    maxBytes: number = FACIAL_READER_MAX_IMAGE_BYTES,
): Promise<string> {
    const trimmed = dataUrlOrRaw.trim();
    const dataUrl = trimmed.startsWith("data:")
        ? trimmed
        : `data:image/jpeg;base64,${trimmed}`;

    const blob = await fetch(dataUrl).then((r) => r.blob());

    const maxW = 400;
    const maxH = 500;

    for (const dimFactor of [1, 0.85, 0.7, 0.55, 0.4]) {
        const bitmap = await createImageBitmap(blob);
        let w = bitmap.width;
        let h = bitmap.height;
        const fit = Math.min(maxW / w, maxH / h, 1) * dimFactor;
        w = Math.max(1, Math.round(w * fit));
        h = Math.max(1, Math.round(h * fit));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            bitmap.close();
            throw new Error("Não foi possível processar a imagem.");
        }
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close();

        for (let q = 0.88; q >= 0.38; q -= 0.05) {
            const jpegBlob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, "image/jpeg", q),
            );
            if (jpegBlob && jpegBlob.size <= maxBytes) {
                const buf = await jpegBlob.arrayBuffer();
                const b64 = uint8ToBase64(new Uint8Array(buf));
                return `data:image/jpeg;base64,${b64}`;
            }
        }
    }

    throw new Error(
        "Não foi possível reduzir a foto para o leitor facial. Tente outra imagem.",
    );
}

/** Em contexto não seguro, prefere input com capture. No mobile, usamos o custom UI com máscara. */
export function preferNativeCameraInput(): boolean {
    if (typeof window === "undefined") return false;
    if (!window.isSecureContext) return true;
    // Removido o isMobileTouchDevice() para que o mobile também use a moldura oval (getUserMedia)
    return false;
}
