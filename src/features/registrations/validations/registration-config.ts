import { z } from "zod";

export const FIELD_RULES = ["required", "optional", "hidden"] as const;
export type FieldRule = (typeof FIELD_RULES)[number];

export const CONFIGURABLE_FIELDS = [
    "document",
    "phone",
    "email",
    "birthDate",
    "block",
    "unit",
    "room",
] as const;
export type ConfigurableField = (typeof CONFIGURABLE_FIELDS)[number];

export type ResolvedRegistrationFieldsConfig = Record<
    ConfigurableField,
    FieldRule
>;

export const FIELD_RULE_LABELS: Record<FieldRule, string> = {
    required: "Obrigatório",
    optional: "Opcional",
    hidden: "Não exibir",
};

export const FIELD_LABELS: Record<ConfigurableField, string> = {
    document: "Documento (CPF/CNPJ)",
    phone: "Telefone",
    email: "E-mail",
    birthDate: "Data de nascimento",
    block: "Bloco",
    unit: "Unidade",
    room: "Sala",
};

const LOCATION_FIELDS_BY_TYPE: Record<string, ConfigurableField[]> = {
    condominium: ["block", "unit"],
    office: ["room"],
    clinic: ["room"],
};

export function locationFieldsForClientType(
    clientType: string,
): ConfigurableField[] {
    return LOCATION_FIELDS_BY_TYPE[clientType] ?? [];
}

export function listedFieldsForClientType(
    clientType: string,
): ConfigurableField[] {
    return [
        "document",
        "phone",
        "email",
        "birthDate",
        ...locationFieldsForClientType(clientType),
    ];
}

export function defaultConfigForClientType(
    clientType: string,
): ResolvedRegistrationFieldsConfig {
    const location = new Set(locationFieldsForClientType(clientType));
    return {
        document: "required",
        phone: "required",
        email: "required",
        birthDate: "hidden",
        block: location.has("block") ? "required" : "hidden",
        unit: location.has("unit") ? "required" : "hidden",
        room: location.has("room") ? "required" : "hidden",
    };
}

export function isFieldVisible(rule: FieldRule | undefined): boolean {
    return rule === "required" || rule === "optional";
}

export function isFieldRequired(rule: FieldRule | undefined): boolean {
    return rule === "required";
}

export const registrationFieldsConfigSchema = z.object({
    document: z.enum(FIELD_RULES),
    phone: z.enum(FIELD_RULES),
    email: z.enum(FIELD_RULES),
    birthDate: z.enum(FIELD_RULES),
    block: z.enum(FIELD_RULES),
    unit: z.enum(FIELD_RULES),
    room: z.enum(FIELD_RULES),
});

export const updateRegistrationFieldsConfigSchema =
    registrationFieldsConfigSchema.partial();

export type UpdateRegistrationFieldsConfig = z.infer<
    typeof updateRegistrationFieldsConfigSchema
>;

export type RegistrationConfigResponse = {
    clientId: string;
    clientType: string;
    fields: ResolvedRegistrationFieldsConfig;
    listedFields: ConfigurableField[];
    birthDateRequiredByRestrictMinors?: boolean;
};
