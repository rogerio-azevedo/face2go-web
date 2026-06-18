export type FeatureSlug =
    | "visitors"
    | "reports"
    | "devices"
    | "access_control"
    | "users"
    | "clients"
    | "monitoring";

/** Recursos premium contratados por empresa (gerenciados pelo super admin). */
export type PremiumFeatureSlug = "monitoring";

export const PREMIUM_FEATURE_SLUGS: PremiumFeatureSlug[] = ["monitoring"];

export type PermissionAction =
    | "can_read"
    | "can_create"
    | "can_update"
    | "can_delete";

export interface FeatureDefinition {
    slug: FeatureSlug;
    name: string;
    description: string;
    category: string;
    isPremium?: boolean;
}

export const ALL_FEATURES: FeatureDefinition[] = [
    {
        slug: "visitors",
        name: "Visitantes",
        description: "Gestão de visitantes e acessos",
        category: "Operações",
    },
    {
        slug: "reports",
        name: "Relatórios",
        description: "Relatórios e exportações",
        category: "Operações",
    },
    {
        slug: "devices",
        name: "Dispositivos",
        description: "Leitores faciais e equipamentos",
        category: "Administração",
    },
    {
        slug: "access_control",
        name: "Controle de acesso",
        description: "Regras e permissões de acesso",
        category: "Administração",
    },
    {
        slug: "users",
        name: "Usuários da empresa",
        description: "Equipe e permissões por módulo",
        category: "Administração",
    },
    {
        slug: "clients",
        name: "Clientes",
        description: "Unidades atendidas pela empresa",
        category: "Administração",
    },
    {
        slug: "monitoring",
        name: "Pedido de Socorro & Monitoramento",
        description:
            'Habilita o botão "Me Ajuda" no app e a central de monitoramento web',
        category: "Premium",
        isPremium: true,
    },
];

export const ALL_ACTIONS: { action: PermissionAction; label: string }[] = [
    { action: "can_read", label: "Visualizar" },
    { action: "can_create", label: "Criar" },
    { action: "can_update", label: "Editar" },
    { action: "can_delete", label: "Excluir" },
];

export const FEATURE_CATEGORIES = ["Operações", "Administração", "Premium"] as const;

export function getPremiumFeatures(): FeatureDefinition[] {
    return ALL_FEATURES.filter((feature) => feature.isPremium === true);
}

export function getFeaturesByCategory(category: string): FeatureDefinition[] {
    return ALL_FEATURES.filter((f) => f.category === category);
}
