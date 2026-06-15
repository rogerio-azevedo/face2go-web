'use server';

import { z } from 'zod';

import { zodFirstMessage } from '@/lib/actions/zod-utils';
import {
  apiFetchAuthed,
  nestErrorMessage,
  parseResponseJson,
} from '@/lib/api-fetch';
import {
  buildSchoolListQuery,
  normalizePaginated,
  type SchoolListParams,
} from '@/lib/pagination';
import {
  createResponsibleSchema,
  linkResponsibleStudentSchema,
  updateResponsibleSchema,
  updateResponsibleStudentLinkSchema,
} from '@/features/school/validations';
import type {
  PaginatedResponse,
  ResponsibleRow,
  ResponsibleStudentLinkWithStudent,
} from '@/features/school/types';
import {
  clientIdSchema as ids,
  revalidateSchoolRoutes,
  stripUndefined,
} from './shared';

export async function listResponsiblesAction(
  clientId: string,
  params: SchoolListParams = {},
): Promise<
  | { success: true; result: PaginatedResponse<ResponsibleRow> }
  | { error: string }
> {
  try {
    const c = ids.safeParse({ clientId });
    if (!c.success) return { error: 'Cliente inválido.' };
    const qs = buildSchoolListQuery(params);
    const res = await apiFetchAuthed(
      `/api/clients/${c.data.clientId}/responsibles?${qs}`,
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { error: nestErrorMessage(data) };
    }
    const parsed = await parseResponseJson(res);
    return {
      success: true,
      result: normalizePaginated<ResponsibleRow>(parsed),
    };
  } catch {
    return { error: 'Sem permissão.' };
  }
}

export async function listResponsibleStudentLinksAction(
  clientId: string,
  responsibleId: string,
): Promise<
  | { success: true; items: ResponsibleStudentLinkWithStudent[] }
  | { error: string }
> {
  try {
    const c = ids.safeParse({ clientId });
    const p = z.string().uuid().safeParse(responsibleId);
    if (!c.success || !p.success) {
      return { error: 'Dados inválidos.' };
    }
    const res = await apiFetchAuthed(
      `/api/clients/${c.data.clientId}/responsibles/${p.data}/students`,
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { error: nestErrorMessage(data) };
    }
    const items =
      (await parseResponseJson(res)) as ResponsibleStudentLinkWithStudent[];
    return { success: true, items: Array.isArray(items) ? items : [] };
  } catch {
    return { error: 'Sem permissão.' };
  }
}

export async function getResponsibleByIdAction(
  clientId: string,
  responsibleId: string,
): Promise<{ success: true; responsible: ResponsibleRow } | { error: string }> {
  try {
    const c = ids.safeParse({ clientId });
    const p = z.string().uuid().safeParse(responsibleId);
    if (!c.success || !p.success) return { error: 'Dados inválidos.' };
    const res = await apiFetchAuthed(
      `/api/clients/${c.data.clientId}/responsibles/${p.data}`,
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { error: nestErrorMessage(data) };
    }
    const responsible = (await parseResponseJson(res)) as ResponsibleRow;
    return { success: true, responsible };
  } catch {
    return { error: 'Sem permissão.' };
  }
}

export async function createResponsibleAction(
  clientId: string,
  input: unknown,
): Promise<{ success: true } | { error: string }> {
  try {
    const c = ids.safeParse({ clientId });
    if (!c.success) return { error: 'Cliente inválido.' };

    const parsed = createResponsibleSchema.safeParse(input);
    if (!parsed.success) return { error: zodFirstMessage(parsed.error) };

    const body = stripUndefined(parsed.data);
    const res = await apiFetchAuthed(`/api/clients/${clientId}/responsibles`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
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

export async function updateResponsibleAction(
  clientId: string,
  responsibleId: string,
  input: unknown,
): Promise<{ success: true } | { error: string }> {
  try {
    const cid = ids.safeParse({ clientId });
    const pid = z.string().uuid().safeParse(responsibleId);
    if (!cid.success || !pid.success) return { error: 'Dados inválidos.' };

    const parsed = updateResponsibleSchema.safeParse(input);
    if (!parsed.success) return { error: zodFirstMessage(parsed.error) };

    const d = { ...parsed.data };
    if (d.password === '') {
      delete d.password;
    }

    if (
      d.name === undefined &&
      d.email === undefined &&
      d.phone === undefined &&
      d.document === undefined &&
      d.password === undefined &&
      d.isActive === undefined
    ) {
      return { error: 'Nada para atualizar.' };
    }

    const body = stripUndefined(d);

    const res = await apiFetchAuthed(
      `/api/clients/${clientId}/responsibles/${responsibleId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
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

export async function deleteResponsibleAction(
  clientId: string,
  responsibleId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const cid = ids.safeParse({ clientId });
    const pid = z.string().uuid().safeParse(responsibleId);
    if (!cid.success || !pid.success) {
      return { error: 'Dados inválidos.' };
    }

    const res = await apiFetchAuthed(
      `/api/clients/${clientId}/responsibles/${responsibleId}`,
      { method: 'DELETE' },
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

export async function linkResponsibleStudentAction(
  clientId: string,
  responsibleId: string,
  input: unknown,
): Promise<{ success: true } | { error: string }> {
  try {
    const cid = ids.safeParse({ clientId });
    const pid = z.string().uuid().safeParse(responsibleId);
    if (!cid.success || !pid.success) return { error: 'Dados inválidos.' };

    const parsed = linkResponsibleStudentSchema.safeParse(input);
    if (!parsed.success) return { error: zodFirstMessage(parsed.error) };

    const res = await apiFetchAuthed(
      `/api/clients/${clientId}/responsibles/${responsibleId}/students`,
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

export async function updateResponsibleStudentLinkAction(
  clientId: string,
  responsibleId: string,
  studentId: string,
  input: unknown,
): Promise<{ success: true } | { error: string }> {
  try {
    const cid = ids.safeParse({ clientId });
    const pid = z.string().uuid().safeParse(responsibleId);
    const sid = z.string().uuid().safeParse(studentId);
    if (!cid.success || !pid.success || !sid.success)
      return { error: 'Dados inválidos.' };

    const parsed = updateResponsibleStudentLinkSchema.safeParse(input);
    if (!parsed.success) return { error: zodFirstMessage(parsed.error) };

    const d = parsed.data;
    if (
      d.relationshipType === undefined &&
      d.isAuthorizedPickup === undefined
    ) {
      return { error: 'Nada para atualizar.' };
    }

    const body = stripUndefined(parsed.data);

    const res = await apiFetchAuthed(
      `/api/clients/${clientId}/responsibles/${responsibleId}/students/${studentId}`,
      { method: 'PATCH', body: JSON.stringify(body) },
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

export async function unlinkResponsibleStudentAction(
  clientId: string,
  responsibleId: string,
  studentId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const cid = ids.safeParse({ clientId });
    const pid = z.string().uuid().safeParse(responsibleId);
    const sid = z.string().uuid().safeParse(studentId);
    if (!cid.success || !pid.success || !sid.success)
      return { error: 'Dados inválidos.' };

    const res = await apiFetchAuthed(
      `/api/clients/${clientId}/responsibles/${responsibleId}/students/${studentId}`,
      { method: 'DELETE' },
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
