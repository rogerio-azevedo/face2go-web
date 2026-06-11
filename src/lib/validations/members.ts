import { z } from "zod";

export const createMemberSchema = z.object({
    roleId: z.string().uuid("Selecione a função."),
    email: z.email("E-mail inválido."),
    password: z
        .string()
        .min(8, "Senha deve ter pelo menos 8 caracteres.")
        .max(128),
    name: z.string().trim().min(1, "Informe o nome.").max(255),
    phone: z.string().trim().max(32).nullable().optional(),
    document: z.string().trim().max(32).nullable().optional(),
    birthDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (YYYY-MM-DD).")
        .nullable()
        .optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateMemberSchema = z.object({
    roleId: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(255).optional(),
    email: z.email("E-mail inválido.").optional(),
    phone: z.string().trim().max(32).nullable().optional(),
    document: z.string().trim().max(32).nullable().optional(),
    birthDate: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
    password: z
        .string()
        .min(8, "Senha deve ter pelo menos 8 caracteres.")
        .max(128)
        .optional(),
    isActive: z.boolean().optional(),
});

export function updateMemberSchemaForEdit(hasAccount: boolean) {
    return updateMemberSchema.superRefine((data, ctx) => {
        if (!hasAccount && data.email && !data.password) {
            ctx.addIssue({
                code: "custom",
                message: "Informe a senha para criar a conta de login.",
                path: ["password"],
            });
        }
    });
}
