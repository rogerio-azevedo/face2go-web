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

function toOpenGraphMetadata(meta: {
    title: string;
    description: string;
    ogImage?: string;
}): Metadata {
    return {
        title: meta.title,
        description: meta.description,
        openGraph: {
            title: meta.title,
            description: meta.description,
            ...(meta.ogImage
                ? {
                      images: [
                          {
                              url: meta.ogImage,
                              width: 1200,
                              height: 630,
                          },
                      ],
                  }
                : {}),
        },
    };
}

export function buildManualMetadata(slug: PublicBrandSlug): Metadata {
    return toOpenGraphMetadata(getPublicBrand(slug).metadata);
}

export function buildFacialGuidelinesMetadata(slug: PublicBrandSlug): Metadata {
    return toOpenGraphMetadata(getPublicBrand(slug).facialMetadata);
}

export type { PublicBrandConfig, PublicBrandSlug } from "@/lib/public-brands/types";
