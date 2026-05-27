import { z } from "zod";

export const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, "Informe e-mail ou CPF")
        .refine(
            (value) => {
                const trimmed = value.trim();
                if (trimmed.includes("@")) {
                    return z.string().email().safeParse(trimmed).success;
                }
                const digits = trimmed.replace(/\D/g, "");
                return digits.length === 11;
            },
            { message: "Informe um e-mail ou CPF válido" },
        ),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
