export type FeatureSlug =
    | "visitors"
    | "reports"
    | "devices"
    | "access_control"
    | "users"
    | "clients";

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
];

export const ALL_ACTIONS: { action: PermissionAction; label: string }[] = [
    { action: "can_read", label: "Visualizar" },
    { action: "can_create", label: "Criar" },
    { action: "can_update", label: "Editar" },
    { action: "can_delete", label: "Excluir" },
];

export const FEATURE_CATEGORIES = ["Operações", "Administração"] as const;

export function getFeaturesByCategory(category: string): FeatureDefinition[] {
    return ALL_FEATURES.filter((f) => f.category === category);
}
