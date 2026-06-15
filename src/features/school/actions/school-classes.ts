'use server';

import { z } from 'zod';

import { zodFirstMessage } from '@/lib/actions/zod-utils';
import {
  apiFetchAuthed,
  nestErrorMessage,
  parseResponseJson,
} from '@/lib/api-fetch';
import {
  createSchoolClassSchema,
  updateSchoolClassSchema,
} from '@/features/school/validations';
import type { SchoolClassRow } from '@/features/school/types';
import { clientIdSchema as ids, revalidateSchoolRoutes } from './shared';

export async function listSchoolClassesAction(
  clientId: string,
): Promise<
  | { success: true; items: SchoolClassRow[] }
  | { error: string }
> {
  try {
    const c = ids.safeParse({ clientId });
    if (!c.success) return { error: 'Cliente inválido.' };
    const res = await apiFetchAuthed(
      `/api/clients/${c.data.clientId}/school-classes`,
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { error: nestErrorMessage(data) };
    }
    const items = (await parseResponseJson(res)) as SchoolClassRow[];
    return { success: true, items: Array.isArray(items) ? items : [] };
  } catch {
    return { error: 'Sem permissão.' };
  }
}

export async function createSchoolClassAction(
  clientId: string,
  input: unknown,
): Promise<{ success: true } | { error: string }> {
  try {
    const c = ids.safeParse({ clientId });
    if (!c.success) return { error: 'Cliente inválido.' };

    const parsed = createSchoolClassSchema.safeParse(input);
    if (!parsed.success) return { error: zodFirstMessage(parsed.error) };

    const res = await apiFetchAuthed(
      `/api/clients/${clientId}/school-classes`,
      { method: 'POST', body: JSON.stringify(parsed.data) },
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { error: nestErrorMessage(data) };
    }

    revalidateSchoolRoutes(clientId);
    return { success: true };
  } catch {
    return { error: 'Sem permissão.' };
  }
}

export async function updateSchoolClassAction(
  clientId: string,
  classId: string,
  input: unknown,
): Promise<{ success: true } | { error: string }> {
  try {
    const cid = ids.safeParse({ clientId });
    const cid2 = z.string().uuid().safeParse(classId);
    if (!cid.success || !cid2.success) return { error: 'Dados inválidos.' };

    const parsed = updateSchoolClassSchema.safeParse(input);
    if (!parsed.success) return { error: zodFirstMessage(parsed.error) };

    const d = parsed.data;
    if (
      d.name === undefined &&
      d.shiftId === undefined &&
      d.year === undefined &&
      d.isActive === undefined
    ) {
      return { error: 'Nada para atualizar.' };
    }

    const res = await apiFetchAuthed(
      `/api/clients/${clientId}/school-classes/${classId}`,
      { method: 'PATCH', body: JSON.stringify(parsed.data) },
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { error: nestErrorMessage(data) };
    }

    revalidateSchoolRoutes(clientId);
    return { success: true };
  } catch {
    return { error: 'Sem permissão.' };
  }
}
