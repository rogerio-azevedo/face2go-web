import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export const clientIdSchema = z.object({
  clientId: z.string().uuid(),
});

export function revalidateSchoolRoutes(clientId: string) {
  revalidatePath('/company/clientes');
  revalidatePath(`/company/clientes/${clientId}/usuarios`);
}

export function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    if (out[k] === undefined) {
      delete out[k];
    }
  }
  return out;
}
