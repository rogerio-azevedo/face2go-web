import { createHash } from "node:crypto";

import type { ResolvedBrand } from "./types";

export const BRAND_OG_WIDTH = 1200;
export const BRAND_OG_HEIGHT = 630;

const GENERIC_OG_PATH = "/og/face2go-generic.png";

export function brandOgImagePath(brand: ResolvedBrand): string {
    if (brand.isDefault || brand.source !== "domain") {
        return GENERIC_OG_PATH;
    }
    const version = createHash("sha1")
        .update(
            `${brand.appName}|${brand.primaryColor}|${brand.accentColor}|${brand.logoUrl}|${brand.logoDarkUrl}`,
        )
        .digest("hex")
        .slice(0, 12);
    return `/og/brand?v=${version}`;
}
