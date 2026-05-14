import { z } from "zod";

/** Alinhado a `school-classes.schema` no servidor. */
export const CLASS_SHIFT_VALUES = [
    "morning",
    "afternoon",
    "evening",
    "fulltime",
] as const;
export type ClassShiftValue = (typeof CLASS_SHIFT_VALUES)[number];

export const CLASS_SHIFT_LABELS: Record<ClassShiftValue, string> = {
    morning: "Manhã",
    afternoon: "Tarde",
    evening: "Noite",
    fulltime: "Integral",
};

const classShiftSchema = z.enum(CLASS_SHIFT_VALUES, {
    message: "Selecione um turno válido.",
});

/** Label para listagens (prioriza turno cadastrado na entidade `shifts`). */
export function schoolClassTurnLabel(row: {
    linkedShiftName: string | null;
    shift: ClassShiftValue | null;
}): string {
    if (row.linkedShiftName?.trim()) {
        return row.linkedShiftName;
    }
    if (row.shift) {
        return CLASS_SHIFT_LABELS[row.shift];
    }
    return "—";
}

/** Campo texto curto opcional — string vira `undefined`. */
export const emptyOptionalShortString = z.preprocess((val: unknown) => {
    if (val === "" || val === undefined || val === null) return undefined;
    return val;
}, z.string().trim().max(32).optional());

export const createSchoolClassSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Informe o nome da turma.")
        .max(255, "Nome muito longo."),
    shiftId: z.string().uuid("Selecione um turno cadastrado."),
    year: z.number().int().min(2000).max(2100),
    isActive: z.boolean().optional().default(true),
});

export const updateSchoolClassSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Informe o nome da turma.")
        .max(255, "Nome muito longo.")
        .optional(),
    shiftId: z.union([z.string().uuid(), z.null()]).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    isActive: z.boolean().optional(),
});

const accessScheduleSchema = z
    .object({
        shifts: z.array(classShiftSchema).optional(),
        entryTime: z.string().trim().max(32).optional(),
        exitTime: z.string().trim().max(32).optional(),
        notes: z.string().trim().max(500).optional(),
    })
    .nullable()
    .optional();

/** Alinhado a `students.schema` no servidor. */
export const createStudentSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Informe o nome do aluno.")
        .max(255),
    enrollment: z
        .string()
        .trim()
        .min(1, "Informe a matrícula.")
        .max(64, "Matrícula muito longa."),
    document: emptyOptionalShortString,
    birthDate: z
        .string()
        .trim()
        .optional()
        .transform((v) => (v === "" || v === undefined ? undefined : v))
        .refine(
            (v) => v === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v),
            "Use a data no formato AAAA-MM-DD.",
        ),
    classId: z
        .union([z.string().uuid(), z.literal("")])
        .optional()
        .transform((v) => (v === "" || v === undefined ? undefined : v)),
    photoKey: z
        .string()
        .trim()
        .max(2048)
        .optional()
        .transform((v) => (v === "" ? undefined : v)),
    accessSchedule: accessScheduleSchema,
    isActive: z.boolean().optional().default(true),
});

export const updateStudentSchema = createStudentSchema
    .omit({ classId: true })
    .partial()
    .extend({
        classId: z
            .union([z.string().uuid(), z.literal(""), z.null()])
            .optional()
            .transform((v) => {
                if (v === undefined) return undefined;
                if (v === "") return null;
                return v;
            }),
    });

export const PARENT_RELATIONSHIP_VALUES = [
    "father",
    "mother",
    "grandfather",
    "grandmother",
    "guardian",
    "other",
] as const;
export type ParentRelationshipValue = (typeof PARENT_RELATIONSHIP_VALUES)[number];

export const RELATIONSHIP_TYPE_LABELS: Record<ParentRelationshipValue, string> =
    {
        father: "Pai",
        mother: "Mãe",
        grandfather: "Avô",
        grandmother: "Avó",
        guardian: "Responsável legal",
        other: "Outro",
    };

const parentRelationshipSchema = z.enum(PARENT_RELATIONSHIP_VALUES, {
    message: "Selecione o parentesco.",
});

export const createParentSchema = z.object({
    email: z.email("E-mail inválido."),
    password: z
        .string()
        .min(8, "Senha deve ter pelo menos 8 caracteres.")
        .max(128),
    name: z.string().trim().min(1, "Informe o nome.").max(255),
    phone: emptyOptionalShortString,
    document: emptyOptionalShortString,
    isActive: z.boolean().optional().default(true),
});

export const updateParentSchema = z.object({
    name: z.string().trim().min(1).max(255).optional(),
    phone: z.preprocess(
        (val: unknown) =>
            val === "" || val === undefined || val === null
                ? null
                : val,
        z.union([z.string().trim().max(32), z.null()]).optional(),
    ),
    document: z.preprocess(
        (val: unknown) =>
            val === "" || val === undefined || val === null
                ? null
                : val,
        z.union([z.string().trim().max(32), z.null()]).optional(),
    ),
    password: z
        .union([
            z.literal(""),
            z
                .string()
                .min(8, "Senha deve ter pelo menos 8 caracteres.")
                .max(128),
        ])
        .optional(),
    isActive: z.boolean().optional(),
});

export const linkParentStudentSchema = z.object({
    studentId: z.string().uuid(),
    relationshipType: parentRelationshipSchema,
    isAuthorizedPickup: z.boolean().optional().default(true),
});
