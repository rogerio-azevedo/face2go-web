/** Limite alinhado ao multer nos endpoints públicos de upload-photo. */
export const MAX_FACE_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Master alinhado ao maior alvo real (Hikvision 720×960, proporção 3:4). */
export const FACE_UPLOAD_MAX_WIDTH = 720;
export const FACE_UPLOAD_MAX_HEIGHT = 960;
export const FACE_UPLOAD_JPEG_QUALITY = 0.85;
const FACE_ASPECT_RATIO = 3 / 4;

function drawCover3x4(
    source: CanvasImageSource,
    srcW: number,
    srcH: number,
    ctx: CanvasRenderingContext2D,
    destW: number,
    destH: number,
) {
    const srcRatio = srcW / srcH;
    let sx = 0;
    let sy = 0;
    let sw = srcW;
    let sh = srcH;
    if (srcRatio > FACE_ASPECT_RATIO) {
        sw = Math.round(srcH * FACE_ASPECT_RATIO);
        sx = Math.round((srcW - sw) / 2);
    } else if (srcRatio < FACE_ASPECT_RATIO) {
        sh = Math.round(srcW / FACE_ASPECT_RATIO);
        sy = Math.round((srcH - sh) / 2);
    }
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, destW, destH);
}

/** Recorta 3:4 e redimensiona para no máximo 720×960 JPEG. */
export async function composeFaceUploadDataUrl(
    source: HTMLVideoElement | HTMLImageElement | string,
): Promise<string> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
        throw new Error("Não foi possível processar a imagem.");
    }

    if (typeof source === "string") {
        const img = new Image();
        img.src = source.startsWith("data:")
            ? source
            : `data:image/jpeg;base64,${source}`;
        await img.decode();
        const destW = Math.min(FACE_UPLOAD_MAX_WIDTH, img.naturalWidth || img.width);
        const destH = Math.round(destW / FACE_ASPECT_RATIO);
        canvas.width = destW;
        canvas.height = Math.min(FACE_UPLOAD_MAX_HEIGHT, destH);
        drawCover3x4(
            img,
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
            ctx,
            canvas.width,
            canvas.height,
        );
        return canvas.toDataURL("image/jpeg", FACE_UPLOAD_JPEG_QUALITY);
    }

    const srcW =
        source instanceof HTMLVideoElement
            ? source.videoWidth
            : source.naturalWidth || source.width;
    const srcH =
        source instanceof HTMLVideoElement
            ? source.videoHeight
            : source.naturalHeight || source.height;
    const destW = Math.min(FACE_UPLOAD_MAX_WIDTH, srcW);
    const destH = Math.round(destW / FACE_ASPECT_RATIO);
    canvas.width = destW;
    canvas.height = Math.min(FACE_UPLOAD_MAX_HEIGHT, destH);
    drawCover3x4(source, srcW, srcH, ctx, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", FACE_UPLOAD_JPEG_QUALITY);
}

/**
 * Converte data URL (preview local) em Blob para upload multipart.
 */
export async function dataUrlToUploadBlob(dataUrl: string): Promise<Blob> {
    const composed = dataUrl.startsWith("data:image/jpeg")
        ? dataUrl
        : await composeFaceUploadDataUrl(dataUrl);
    const trimmed = composed.trim();
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
