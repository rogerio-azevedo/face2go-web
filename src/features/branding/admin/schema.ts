import { z } from "zod";

const optionalHex = z
    .string()
    .trim()
    .refine((value) => value === "" || /^#[0-9a-fA-F]{6}$/.test(value), {
        message: "Use uma cor no formato #RRGGBB.",
    });

export const companyBrandingFormSchema = z.object({
    enabled: z.boolean(),
    appName: z.string().trim().max(80, "Nome do produto: no máximo 80 caracteres."),
    primaryColor: optionalHex,
    accentColor: optionalHex,
    customDomain: z.string().trim(),
});

export type CompanyBrandingFormInput = z.infer<typeof companyBrandingFormSchema>;

export function toBrandingPayload(input: CompanyBrandingFormInput) {
    const empty = (value: string) => {
        const trimmed = value.trim();
        return trimmed === "" ? null : trimmed;
    };
    return {
        enabled: input.enabled,
        appName: empty(input.appName),
        primaryColor: empty(input.primaryColor)?.toLowerCase() ?? null,
        accentColor: empty(input.accentColor)?.toLowerCase() ?? null,
        customDomain: empty(input.customDomain)?.toLowerCase() ?? null,
    };
}
