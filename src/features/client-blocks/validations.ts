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

const floorsShape = {
    floorStart: z.coerce.number().int().min(1, "Andar mínimo é 1.").max(99),
    floorEnd: z.coerce.number().int().min(1).max(99),
    unitsPerFloor: z.coerce
        .number()
        .int()
        .min(1, "Informe quantos apartamentos por andar.")
        .max(99),
};

const floorsInOrder = (value: { floorStart: number; floorEnd: number }) =>
    value.floorEnd >= value.floorStart;
const FLOORS_ORDER_MESSAGE =
    "O último andar deve ser maior ou igual ao primeiro.";

/** Alinhado ao `generateClientUnitsSchema` do server. */
export const generateUnitsSchema = z
    .object(floorsShape)
    .refine(floorsInOrder, { message: FLOORS_ORDER_MESSAGE });

/** Alinhado ao `generateStructureSchema` do server. */
export const generateStructureSchema = z
    .object({
        blockStart: z.coerce.number().int().min(0).max(9999),
        blockEnd: z.coerce.number().int().min(0).max(9999),
        blockDigits: z.coerce.number().int().min(1).max(4),
        ...floorsShape,
    })
    .refine((value) => value.blockEnd >= value.blockStart, {
        message: "O último bloco deve ser maior ou igual ao primeiro.",
    })
    .refine(floorsInOrder, { message: FLOORS_ORDER_MESSAGE });

export type GenerateUnitsInput = z.infer<typeof generateUnitsSchema>;
export type GenerateStructureInput = z.infer<typeof generateStructureSchema>;

export function floorUnitNames(input: GenerateUnitsInput) {
    const names: string[] = [];
    for (let floor = input.floorStart; floor <= input.floorEnd; floor += 1) {
        for (let n = 1; n <= input.unitsPerFloor; n += 1) {
            names.push(String(floor * 100 + n));
        }
    }
    return names;
}

export const ensureLocationUnitSchema = z.object({
    blockName: blockNameSchema,
    unitName: unitNameSchema,
});

export const bindLocationGroupsSchema = z.object({
    items: z
        .array(
            z.object({
                blockText: z.string().max(200),
                unitText: z.string().max(200),
                unitId: z.string().uuid("Escolha a unidade."),
            }),
        )
        .min(1, "Nada para vincular.")
        .max(500),
});
