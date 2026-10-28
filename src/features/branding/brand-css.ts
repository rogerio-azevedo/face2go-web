import { contrastTextColor } from "@/lib/branding";

import type { ResolvedBrand } from "./types";

export function brandCss(brand: ResolvedBrand): string {
    if (brand.isDefault) return "";
    const primaryText = contrastTextColor(brand.primaryColor);
    const accentText = contrastTextColor(brand.accentColor);
    return `:root {
  --primary: ${brand.primaryColor};
  --primary-foreground: ${primaryText};
  --ring: ${brand.primaryColor};
  --sidebar-primary: ${brand.primaryColor};
  --sidebar-primary-foreground: ${primaryText};
  --accent: ${brand.accentColor};
  --accent-foreground: ${accentText};
  --color-brand-turquoise: ${brand.primaryColor};
  --color-brand-deep-navy: ${brand.accentColor};
}`;
}
