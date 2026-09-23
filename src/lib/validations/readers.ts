import { z } from "zod";

/** IPv4 ou IPv6 (validação básica). */
const IP_REGEX =
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,3})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,3})$|^\[?[0-9a-fA-F:.]+\]?$/;

/** Hostname/DNS (ASCII); FQDN conforme etiquetas RFC 1035 (1–253 chars total). */
function isValidHostname(host: string): boolean {
    if (host.length > 253) return false;
    const labels = host.split(".");
    for (const label of labels) {
        if (label.length === 0 || label.length > 63) return false;
        if (!/^[a-zA-Z0-9-]+$/.test(label)) return false;
        if (label.startsWith("-") || label.endsWith("-")) return false;
    }
    return labels.length >= 1;
}

function isIpOrHostname(v: string): boolean {
    return IP_REGEX.test(v) || isValidHostname(v);
}

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

export const READER_DIRECTIONS = ["in", "out"] as const;

export const READER_CONNECTION_MODES = ["direct", "auto_register"] as const;

export const READER_CONNECTION_MODE_LABELS: Record<
    (typeof READER_CONNECTION_MODES)[number],
    string
> = {
    direct: "Direto (IP ou NAT)",
    auto_register: "Registro automático (sem NAT)",
};
export type ReaderDirectionSlug = (typeof READER_DIRECTIONS)[number];

export const READER_BRAND_LABELS: Record<ReaderBrandSlug, string> = {
    intelbras: "Intelbras",
    hikvision: "Hikvision",
};

export const READER_DIRECTION_LABELS: Record<ReaderDirectionSlug, string> = {
    in: "Entrada",
    out: "Saída",
};

/** Objeto base sem refinamentos — permite `.partial()` no PATCH (Zod 4). */
const readerFields = z.object({
    clientId: z.string().uuid("Cliente inválido."),
    brand: z.enum(READER_BRANDS, { message: "Marca inválida." }),
    direction: z.union([z.literal(""), z.enum(READER_DIRECTIONS)]),
    name: z
        .string()
        .trim()
        .min(2, "Nome deve ter pelo menos 2 caracteres")
        .max(255, "Nome muito longo"),
    description: optionalTrimmed,
    ip: z
        .string()
        .trim()
        .min(1, "IP ou hostname é obrigatório")
        .max(253, "Endereço muito longo (máximo 253 caracteres).")
        .refine((v) => isIpOrHostname(v), {
            message: "Informe um IP válido ou um hostname (DNS/DDNS).",
        }),
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
    restrictMinors: z.boolean(),
    connectionMode: z.enum(READER_CONNECTION_MODES),
    autoRegisterDeviceId: z.string().max(64, "ID muito longo"),
});

function autoRegisterIdOk(input: {
    connectionMode?: string;
    autoRegisterDeviceId?: string;
}): boolean {
    if (input.connectionMode !== "auto_register") return true;
    return (input.autoRegisterDeviceId ?? "").trim().length > 0;
}

function passwordLengthOk(password: string | undefined): boolean {
    if (password === undefined || password.length === 0) return true;
    return password.length >= 4 && password.length <= 256;
}

/** Schema do formulário (react-hook-form). */
export const readerFormSchema = readerFields
    .refine((d) => passwordLengthOk(d.password), {
        message: "Senha deve ter entre 4 e 256 caracteres",
        path: ["password"],
    })
    .refine((d) => autoRegisterIdOk(d), {
        message: "Informe o ID de registro automático do leitor.",
        path: ["autoRegisterDeviceId"],
    });

const readerCreateApiFields = readerFields
    .omit({ direction: true })
    .extend({
        direction: z.enum(READER_DIRECTIONS).optional(),
    });

/** POST na API — payload JSON (sentido omitido quando vazio). */
export const createReaderSchema = readerCreateApiFields
    .refine((d) => passwordLengthOk(d.password), {
        message: "Senha deve ter entre 4 e 256 caracteres",
        path: ["password"],
    })
    .refine(
        (d) =>
            !d.password ||
            d.password.length === 0 ||
            d.username.trim().length > 0,
        {
            message: "Informe o usuário do leitor para salvar a senha.",
            path: ["username"],
        },
    )
    .refine((d) => autoRegisterIdOk(d), {
        message: "Informe o ID de registro automático do leitor.",
        path: ["autoRegisterDeviceId"],
    });

/** PATCH enviado à API: sentido nulo limpa o campo no servidor. */
export const updateReaderSchema = readerFields
    .partial()
    .extend({
        direction: z.enum(READER_DIRECTIONS).nullable().optional(),
    })
    .refine((d) => passwordLengthOk(d.password), {
        message: "Senha deve ter entre 4 e 256 caracteres",
        path: ["password"],
    })
    .refine((d) => autoRegisterIdOk(d), {
        message: "Informe o ID de registro automático do leitor.",
        path: ["autoRegisterDeviceId"],
    });

/** Alias legado (imports antigos). */
export const readerSchema = readerFormSchema;

/** Valores do formulário (alinhados ao defaultValues do react-hook-form). */
export type ReaderFormPayload = {
    clientId: string;
    brand: ReaderBrandSlug;
    direction: "" | ReaderDirectionSlug;
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
    restrictMinors: boolean;
    connectionMode: "direct" | "auto_register";
    autoRegisterDeviceId: string;
};

export type ReaderUpdatePayload = z.infer<typeof updateReaderSchema>;
