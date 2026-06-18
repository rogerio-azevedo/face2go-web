import { z } from "zod";

const cepRegex = /^\d{5}-?\d{3}$/;

export const GEOCODING_PROVIDERS = ["here", "manual"] as const;
export const GEOCODING_PRECISIONS = [
    "rooftop",
    "street",
    "approximate",
] as const;

export function normalizeCountryCode(value?: string): string {
    const code = (value ?? "BR").trim().toUpperCase();
    if (code === "BRA" || code === "BR") return "BR";
    return code.slice(0, 2);
}

export function normalizeCep(value?: string): string | undefined {
    if (!value?.trim()) return undefined;
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 8) return value.trim();
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export const clientAddressFormSchema = z
    .object({
        label: z.string().trim().min(1, "Informe um rótulo.").max(100),
        isPrimary: z.boolean(),
        cep: z
            .string()
            .trim()
            .optional()
            .transform((value) => normalizeCep(value)),
        street: z.string().trim().optional(),
        number: z.string().trim().optional(),
        complement: z.string().trim().optional(),
        neighborhood: z.string().trim().optional(),
        city: z.string().trim().optional(),
        state: z
            .string()
            .trim()
            .optional()
            .transform((value) => value?.toUpperCase()),
        country: z
            .string()
            .trim()
            .transform(normalizeCountryCode)
            .pipe(z.string().length(2, "País inválido.")),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        geocodingProvider: z.enum(GEOCODING_PROVIDERS),
        geocodingPrecision: z.enum(GEOCODING_PRECISIONS).optional(),
        hereLocationId: z.string().trim().optional(),
    })
    .superRefine((data, ctx) => {
        const hasLat = data.latitude !== undefined;
        const hasLng = data.longitude !== undefined;
        if (hasLat !== hasLng) {
            ctx.addIssue({
                code: "custom",
                message: "Informe latitude e longitude juntas.",
                path: ["latitude"],
            });
        }
        if (data.cep && !cepRegex.test(data.cep)) {
            ctx.addIssue({
                code: "custom",
                message: "CEP inválido.",
                path: ["cep"],
            });
        }
        if (data.state && data.state.length !== 2) {
            ctx.addIssue({
                code: "custom",
                message: "UF deve ter 2 caracteres.",
                path: ["state"],
            });
        }
    });

export type ClientAddressFormInput = z.infer<typeof clientAddressFormSchema>;

export type GeocodingSuggestion = {
    id: string;
    label: string;
    address: {
        cep?: string;
        street?: string;
        number?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
        country?: string;
    };
    latitude: number;
    longitude: number;
    precision?: (typeof GEOCODING_PRECISIONS)[number];
};
