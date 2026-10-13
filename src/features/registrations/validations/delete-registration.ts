import { z } from 'zod';

// Alinhado ao deleteRegistrationSchema do backend.
export const deleteRegistrationSchema = z.object({
  reason: z.string().trim()
    .min(3, 'Informe o motivo da exclusão (mínimo 3 caracteres).')
    .max(2000, 'O motivo da exclusão deve ter no máximo 2.000 caracteres.'),
});

