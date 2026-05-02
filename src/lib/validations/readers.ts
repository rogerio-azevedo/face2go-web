import { z } from "zod";

/** IPv4 ou IPv6 (validação básica). */
const IP_REGEX =
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,3})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,3})$|^\[?[0-9a-fA-F:.]+\]?$/;

const optionalTrimmed = z
    .string()
    .optional()
    .transform((v) => {
        if (v === undefined) return undefined;
        const t = v.trim();
        return t === "" ? undefined : t;
    });

export const READER_BRANDS = ["intelbras", "hikvision"] as const;
export type ReaderBrandSlug = (typeof READER_BRANDS)[number];

export const READER_BRAND_LABELS: Record<ReaderBrandSlug, string> = {
    intelbras: "Intelbras",
    hikvision: "Hikvision",
};

/** Objeto base sem refinamentos — permite `.partial()` no PATCH (Zod 4). */
const readerFields = z.object({
    clientId: z.string().uuid("Cliente inválido."),
    brand: z.enum(READER_BRANDS, { message: "Marca inválida." }),
    name: z
        .string()
        .trim()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(255, "Nome muito longo"),
    description: optionalTrimmed,
    ip: z
        .string()
        .trim()
        .min(1, "IP é obrigatório")
        .max(45, "IP muito longo")
        .refine((v) => IP_REGEX.test(v), { message: "IP inválido." }),
    port: z.coerce
        .number({ message: "Porta inválida." })
        .int()
        .min(1, "Porta entre 1 e 65535")
        .max(65535, "Porta entre 1 e 65535"),
    serialNumber: optionalTrimmed,
    model: optionalTrimmed,
    location: optionalTrimmed,
    username: z.string().max(120, "Usuário muito longo"),
    password: z.string(),
    isActive: z.boolean(),
});

function passwordLengthOk(password: string | undefined): boolean {
    if (password === undefined || password.length === 0) return true;
    return password.length >= 4 && password.length <= 256;
}

/** Schema do formulário (react-hook-form). */
export const readerFormSchema = readerFields.refine(
    (d) => passwordLengthOk(d.password),
    {
        message: "Senha deve ter entre 4 e 256 caracteres",
        path: ["password"],
    },
);

/** POST só no servidor — exige usuário se houver senha. */
export const createReaderSchema = readerFormSchema.refine(
    (d) =>
        !d.password ||
        d.password.length === 0 ||
        d.username.trim().length > 0,
    {
        message: "Informe o usuário do leitor para salvar a senha.",
        path: ["username"],
    },
);

/** PATCH: campos opcionais; mesma regra de tamanho da senha quando enviada. */
export const updateReaderSchema = readerFields
    .partial()
    .refine((d) => passwordLengthOk(d.password), {
        message: "Senha deve ter entre 4 e 256 caracteres",
        path: ["password"],
    });

/** Alias legado (imports antigos). */
export const readerSchema = readerFormSchema;

/** Valores do formulário (alinhados ao defaultValues do react-hook-form). */
export type ReaderFormPayload = {
    clientId: string;
    brand: ReaderBrandSlug;
    name: string;
    description?: string;
    ip: string;
    port: number;
    serialNumber?: string;
    model?: string;
    location?: string;
    username: string;
    password: string;
    isActive: boolean;
};

export type ReaderUpdatePayload = z.infer<typeof updateReaderSchema>;
