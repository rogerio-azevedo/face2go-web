import path from "node:path";
import type { NextConfig } from "next";

const appRoot = path.join(__dirname);

const nextConfig: NextConfig = {
    // Evita o Turbopack inferir a pasta pai (Face2Go) e assistir o mobile (~10 GB).
    turbopack: {
        root: appRoot,
    },
    outputFileTracingRoot: appRoot,
    // Vercel Image Optimization está em 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED).
    // Sem isso, next/image quebra logos, manual e orientações faciais para quem não tem cache.
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
