import { z } from "zod";

/** Remove caracteres não alfanuméricos e uppercase (alinhado ao servidor). */
export function normalizeVehiclePlate(raw: string): string {
    return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

/** Formato antigo ABC1234 ou Mercosul ABC1D23 */
const BR_PLATE_RE = /^([A-Z]{3}[0-9]{4}|[A-Z]{3}[0-9][A-Z][0-9]{2})$/;

export const vehicleUpsertSchema = z
    .object({
        driverResponsibleId: z
            .string()
            .uuid("Selecione o condutor (responsável)."),
        plate: z.string(),
        brand: z
            .string()
            .trim()
            .min(1, "Informe a marca.")
            .max(100),
        model: z
            .string()
            .trim()
            .min(1, "Informe o modelo.")
            .max(100),
        color: z
            .string()
            .trim()
            .min(1, "Informe a cor.")
            .max(50),
    })
    .transform((d) => ({
        driverResponsibleId: d.driverResponsibleId,
        plate: normalizeVehiclePlate(d.plate),
        brand: d.brand.trim(),
        model: d.model.trim(),
        color: d.color.trim(),
    }))
    .superRefine((d, ctx) => {
        if (!BR_PLATE_RE.test(d.plate)) {
            ctx.addIssue({
                code: "custom",
                message:
                    "Placa inválida. Use ABC1234 ou Mercosul (ABC1D23).",
                path: ["plate"],
            });
        }
    });

export type VehicleUpsertOutput = z.output<typeof vehicleUpsertSchema>;
