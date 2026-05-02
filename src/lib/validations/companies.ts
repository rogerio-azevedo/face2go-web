import { z } from "zod";

const CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

/**
 * Campos vindos do client podem ficar omitidos ao ir para uma Server Action
 * (JSON remove chaves `undefined`). `z.string().optional()` aceita omitido OU string.
 */
const optionalTrimmed = z
    .string()
    .optional()
    .transform((v) => {
        if (v === undefined) return undefined;
        const t = v.trim();
        return t === "" ? undefined : t;
    });

export const companySchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(255, "Nome muito longo"),
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
    isActive: z.boolean(),
});

export const createCompanySchema = companySchema;

export const updateCompanySchema = companySchema.partial();

/** Payload vindo do form / Server Action (chaves opcionais podem ser omitidas). */
export type CompanyFormPayload = z.input<typeof createCompanySchema>;
/** Payload de atualização partial (omit + undefined ok). */
export type CompanyUpdatePayload = z.input<typeof updateCompanySchema>;
/** Estado normalizado após `safeParse`. */
export type CompanyParsed = z.infer<typeof createCompanySchema>;
