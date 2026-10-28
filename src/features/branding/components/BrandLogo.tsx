"use client";

import { cn } from "@/lib/utils";

import { useBrand } from "./BrandProvider";

export function BrandLogo({
    variant = "onLight",
    className,
}: {
    variant?: "onLight" | "onDark";
    className?: string;
}) {
    const brand = useBrand();
    const src = variant === "onDark" ? brand.logoDarkUrl : brand.logoUrl;
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={brand.appName}
            className={cn("h-10 w-auto max-w-[200px] shrink-0 object-contain", className)}
        />
    );
}
