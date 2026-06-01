import { z } from "zod";

const IP_REGEX =
    /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d{1,3})\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d{1,3})$|^\[?[0-9a-fA-F:.]+\]?$/;

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

export const CAMERA_TYPES = ["lpr", "ptz", "general"] as const;
export type CameraTypeSlug = (typeof CAMERA_TYPES)[number];

export const CAMERA_BRANDS = ["intelbras"] as const;
export type CameraBrandSlug = (typeof CAMERA_BRANDS)[number];

export const CAMERA_TYPE_LABELS: Record<CameraTypeSlug, string> = {
    lpr: "LPR (placas)",
    ptz: "PTZ",
    general: "Geral",
};

export const CAMERA_BRAND_LABELS: Record<CameraBrandSlug, string> = {
    intelbras: "Intelbras",
};

export const CAMERA_DIRECTIONS = ["in", "out"] as const;
export type CameraDirectionSlug = (typeof CAMERA_DIRECTIONS)[number];

export const CAMERA_DIRECTION_LABELS: Record<CameraDirectionSlug, string> = {
    in: "Entrada",
    out: "Saída",
};

/** Objeto base — permite `.partial()` no PATCH. */
const cameraFields = z.object({
    clientId: z.string().uuid("Cliente inválido."),
    type: z.enum(CAMERA_TYPES, { message: "Tipo inválido." }),
    direction: z.union([z.literal(""), z.enum(CAMERA_DIRECTIONS)]),
    brand: z.enum(CAMERA_BRANDS, { message: "Marca inválida." }),
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
    deviceId: z
        .string()
        .optional()
        .transform((v) => {
            if (v === undefined) return undefined;
            const t = v.trim();
            return t === "" ? undefined : t;
        })
        .refine((v) => v === undefined || v.length <= 64, {
            message: "Device ID muito longo.",
        }),
    username: z.string().max(120, "Usuário muito longo"),
    password: z.string(),
    isActive: z.boolean(),
});

function passwordLengthOk(password: string | undefined): boolean {
    if (password === undefined || password.length === 0) return true;
    return password.length >= 4 && password.length <= 256;
}

/** Schema do formulário (react-hook-form). */
export const cameraFormSchema = cameraFields.refine(
    (d) => passwordLengthOk(d.password),
    {
        message: "Senha deve ter entre 4 e 256 caracteres",
        path: ["password"],
    },
);

export type CameraFormPayload = {
    clientId: string;
    type: CameraTypeSlug;
    direction: "" | CameraDirectionSlug;
    brand: CameraBrandSlug;
    name: string;
    description?: string;
    ip: string;
    port: number;
    serialNumber?: string;
    model?: string;
    location?: string;
    deviceId?: string;
    username: string;
    password: string;
    isActive: boolean;
};

const cameraCreateApiFields = cameraFields
    .omit({ direction: true })
    .extend({
        direction: z.enum(CAMERA_DIRECTIONS).optional(),
    });

/** POST na API Nest. */
export const createCameraSchema = cameraCreateApiFields
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
            message: "Informe o usuário da câmera para salvar a senha.",
            path: ["username"],
        },
    );

/** PATCH — body parcial válido antes do envio. */
export const updateCameraSchema = cameraFields
    .partial()
    .extend({
        direction: z.enum(CAMERA_DIRECTIONS).nullable().optional(),
    });
