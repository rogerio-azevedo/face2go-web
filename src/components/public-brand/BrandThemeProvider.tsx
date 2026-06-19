import type { CSSProperties, ReactNode } from "react";

import type { PublicBrandConfig } from "@/lib/public-brands/types";

type BrandThemeProviderProps = {
    config: PublicBrandConfig;
    children: ReactNode;
};

export function BrandThemeProvider({
    config,
    children,
}: BrandThemeProviderProps) {
    const style = {
        "--brand-deep-navy": config.colors.deepNavy,
        "--brand-accent": config.colors.accent,
        "--brand-accent-foreground": config.colors.accentForeground,
        "--brand-link": config.colors.link,
        "--brand-off-white": config.colors.offWhite,
        "--brand-slate": config.colors.slate,
    } as CSSProperties;

    return (
        <div
            data-brand={config.slug}
            style={style}
            className="brand-themed flex min-h-dvh flex-col"
        >
            {children}
        </div>
    );
}
