import path from "node:path";
import type { NextConfig } from "next";

const appRoot = path.join(__dirname);

const nextConfig: NextConfig = {
    // Evita o Turbopack inferir a pasta pai (Face2Go) e assistir o mobile (~10 GB).
    turbopack: {
        root: appRoot,
    },
    outputFileTracingRoot: appRoot,
};

export default nextConfig;
