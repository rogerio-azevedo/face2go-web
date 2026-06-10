import { z } from "zod";

const CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const optionalTrimmed = z
    .string()
    .optional()
    .transform((v) => {
        if (v === undefined) return undefined;
        const t = v.trim();
        return t === "" ? undefined : t;
    });

/** Igual ao backend: UTC± em minutos; |inteiro| ≤ 14 conta como horas (ex.: -4 → −240). */
export const TZ_OFFSET_ABS_MAX = 14 * 60;

export function normalizeClientTimezoneOffset(raw: unknown): number {
    if (raw === undefined || raw === null || raw === "")
        throw new Error("INVALID_TZ_OFFSET");
    const n =
        typeof raw === "number"
            ? raw
            : Number(String(raw).trim().replace(",", "."));
    if (!Number.isFinite(n) || !Number.isInteger(n))
        throw new Error("INVALID_TZ_OFFSET");
    let m = n;
    if (Math.abs(m) <= 14) {
        m *= 60;
    }
    if (
        !Number.isInteger(m) ||
        m < -TZ_OFFSET_ABS_MAX ||
        m > TZ_OFFSET_ABS_MAX
    ) {
        throw new Error("INVALID_TZ_OFFSET");
    }
    return m;
}

export const CLIENT_TYPES = [
    "office",
    "clinic",
    "condominium",
    "school",
    "other",
] as const;
export type ClientType = (typeof CLIENT_TYPES)[number];

const baseClientShape = {
    name: z
        .string()
        .trim()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(255, "Nome muito longo"),
    type: z.enum(CLIENT_TYPES, {
        message: "Selecione um tipo válido.",
    }),
    cnpj: optionalTrimmed.refine((val) => val === undefined || CNPJ_REGEX.test(val), {
        message: "CNPJ inválido (use XX.XXX.XXX/XXXX-XX)",
    }),
    phone: optionalTrimmed,
    email: optionalTrimmed.refine(
        (val) => val === undefined || z.email().safeParse(val).success,
        { message: "E-mail inválido" },
    ),
    logoUrl: optionalTrimmed.refine(
        (val) =>
            val === undefined || /^https?:\/\/[^\s]+$/.test(val),
        {
            message:
                "Opcional — se preencher, use uma URL completa com http ou https.",
        },
    ),
    primaryColor: optionalTrimmed.refine(
        (val) => val === undefined || HEX_COLOR_REGEX.test(val),
        {
            message: "Opcional — use cor hexadecimal (#RRGGBB).",
        },
    ),
    privacyPolicyUrl: optionalTrimmed.refine(
        (val) =>
            val === undefined || /^https?:\/\/[^\s]+$/.test(val),
        {
            message:
                "Opcional — se preencher, use uma URL completa com http ou https.",
        },
    ),
    privacyAlias: optionalTrimmed.pipe(
        z.string().max(100, "Alias muito longo (máx. 100 caracteres)").optional(),
    ),
    isActive: z.boolean(),
};

const timezoneOffsetCreate = z.preprocess((raw: unknown) => {
    try {
        if (raw === undefined || raw === null || raw === "") return 0;
        return normalizeClientTimezoneOffset(raw);
    } catch {
        return Number.NaN;
    }
}, z.number().int().min(-TZ_OFFSET_ABS_MAX).max(TZ_OFFSET_ABS_MAX));

const timezoneOffsetUpdate = z.preprocess((raw: unknown) => {
    if (raw === undefined) return undefined;
    try {
        return normalizeClientTimezoneOffset(raw);
    } catch {
        return Number.NaN;
    }
}, z.number().int().min(-TZ_OFFSET_ABS_MAX).max(TZ_OFFSET_ABS_MAX).optional());

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
    office: "Escritório",
    clinic: "Clínica",
    condominium: "Condomínio",
    school: "Escola",
    other: "Outro",
};

export const clientSchema = z
    .object({
        ...baseClientShape,
        timezoneOffsetMinutes: timezoneOffsetCreate,
    })
    .superRefine((data, ctx) => {
        if (data.privacyAlias && !data.privacyPolicyUrl) {
            ctx.addIssue({
                code: "custom",
                message:
                    "Informe a URL da política de privacidade ao definir um alias.",
                path: ["privacyPolicyUrl"],
            });
        }
    });

export const createClientSchema = clientSchema;

export const updateClientSchema = z
    .object({
        ...baseClientShape,
        timezoneOffsetMinutes: timezoneOffsetUpdate,
    })
    .partial();

export type ClientFormPayload = z.input<typeof createClientSchema>;
export type ClientUpdatePayload = z.input<typeof updateClientSchema>;
export type ClientParsed = z.infer<typeof createClientSchema>;
