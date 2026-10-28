import type { UserContext } from "@/types/auth-context";

import type { ResolvedBrand } from "./types";

export function contextCompanyId(context: UserContext): string | null {
    switch (context.type) {
        case "company":
        case "client":
            return context.companyId;
        case "responsible":
        case "member":
            return context.companyId ?? null;
        default:
            return null;
    }
}

export function contextsForBrand(
    contexts: UserContext[],
    brand: ResolvedBrand,
): UserContext[] {
    if (brand.source !== "domain" || !brand.companyId) return contexts;
    return contexts.filter(
        (context) => contextCompanyId(context) === brand.companyId,
    );
}
