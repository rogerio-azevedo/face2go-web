const PNG_SIZE = 1024;
const QUIET_ZONE = 80;

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Falha ao renderizar o QR."));
        image.src = src;
    });
}

export async function downloadQrSvgAsPng(
    svg: SVGSVGElement,
    filename: string,
): Promise<void> {
    const cloned = svg.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    cloned.setAttribute("width", String(PNG_SIZE));
    cloned.setAttribute("height", String(PNG_SIZE));

    const xml = new XMLSerializer().serializeToString(cloned);
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    try {
        const image = await loadImage(svgUrl);
        const canvas = document.createElement("canvas");
        canvas.width = PNG_SIZE;
        canvas.height = PNG_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new Error("Canvas indisponível.");
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, PNG_SIZE, PNG_SIZE);
        const inner = PNG_SIZE - QUIET_ZONE * 2;
        ctx.drawImage(image, QUIET_ZONE, QUIET_ZONE, inner, inner);

        await new Promise<void>((resolve, reject) => {
            canvas.toBlob((png) => {
                if (!png) {
                    reject(new Error("Falha ao gerar PNG."));
                    return;
                }
                const a = document.createElement("a");
                const pngUrl = URL.createObjectURL(png);
                a.href = pngUrl;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(pngUrl);
                resolve();
            }, "image/png");
        });
    } finally {
        URL.revokeObjectURL(svgUrl);
    }
}
