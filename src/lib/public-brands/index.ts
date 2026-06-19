import type { Metadata } from "next";

import { face2goBrand } from "@/lib/public-brands/face2go";
import { ienhBrand } from "@/lib/public-brands/ienh";
import type { PublicBrandConfig, PublicBrandSlug } from "@/lib/public-brands/types";

const BRANDS: Record<PublicBrandSlug, PublicBrandConfig> = {
    face2go: face2goBrand,
    ienh: ienhBrand,
};

export function getPublicBrand(slug: PublicBrandSlug): PublicBrandConfig {
    return BRANDS[slug];
}

export function buildManualMetadata(slug: PublicBrandSlug): Metadata {
    const config = getPublicBrand(slug);
    const { metadata } = config;

    return {
        title: metadata.title,
        description: metadata.description,
        openGraph: {
            title: metadata.title,
            description: metadata.description,
            ...(metadata.ogImage
                ? {
                      images: [
                          {
                              url: metadata.ogImage,
                              width: 1200,
                              height: 630,
                          },
                      ],
                  }
                : {}),
        },
    };
}

export type { PublicBrandConfig, PublicBrandSlug } from "@/lib/public-brands/types";
