import type { FeatureSlug } from "./features";

/**
 * Rotas da área empresa → feature necessária para `can_read`.
 * Rotas não listadas ficam sem checagem de feature (ex.: dashboard).
 */
export const ROUTE_PERMISSIONS: Partial<Record<string, FeatureSlug>> = {
    "/company/usuarios": "users",
    "/company/clientes": "clients",
    "/company/leitores": "clients",
};
