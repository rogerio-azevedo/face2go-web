import { z } from "zod";

export const blockNameSchema = z
    .string()
    .trim()
    .min(1, "Informe o nome do bloco.")
    .max(100);

export const unitNameSchema = z
    .string()
    .trim()
    .min(1, "Informe a unidade.")
    .max(50);

export const generateUnitsSchema = z
    .object({
        start: z.coerce.number().int().min(0).max(99999),
        end: z.coerce.number().int().min(0).max(99999),
    })
    .refine((value) => value.end >= value.start, {
        message: "O fim do intervalo deve ser maior ou igual ao início.",
    });
