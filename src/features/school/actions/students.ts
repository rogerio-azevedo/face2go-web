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
  createStudentSchema,
  linkStudentClassSchema,
  updateStudentSchema,
} from '@/features/school/validations';
import type {
  PaginatedResponse,
  StudentResponsibleLinkWithResponsible,
  StudentRow,
} from '@/features/school/types';
import {
  clientIdSchema as ids,
  revalidateSchoolRoutes,
  stripUndefined,
} from './shared';

export async function listStudentsAction(
  clientId: string,
  params: SchoolListParams = {},
): Promise<
  | { success: true; result: PaginatedResponse<StudentRow> }
  | { error: string }
> {
  try {
    const c = ids.safeParse({ clientId });
    if (!c.success) return { error: 'Cliente inválido.' };
    const qs = buildSchoolListQuery(params);
    const res = await apiFetchAuthed(
      `/api/clients/${c.data.clientId}/students?${qs}`,
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { error: nestErrorMessage(data) };
    }
    const parsed = await parseResponseJson(res);
    return {
      success: true,
      result: normalizePaginated<StudentRow>(parsed),
    };
  } catch {
    return { error: 'Sem permissão.' };
  }
}

export async function getStudentByIdAction(
  clientId: string,
  studentId: string,
): Promise<{ success: true; student: StudentRow } | { error: string }> {
  try {
    const c = ids.safeParse({ clientId });
    const s = z.string().uuid().safeParse(studentId);
    if (!c.success || !s.success) return { error: 'Dados inválidos.' };
    const res = await apiFetchAuthed(
      `/api/clients/${c.data.clientId}/students/${s.data}`,
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { error: nestErrorMessage(data) };
    }
    const student = (await parseResponseJson(res)) as StudentRow;
    return { success: true, student };
  } catch {
    return { error: 'Sem permissão.' };
  }
}

export async function linkStudentClassAction(
  clientId: string,
  studentId: string,
  input: unknown,
): Promise<{ success: true } | { error: string }> {
  try {
    const cid = ids.safeParse({ clientId });
    const sid = z.string().uuid().safeParse(studentId);
    if (!cid.success || !sid.success) {
      return { error: 'Dados inválidos.' };
    }

    const parsed = linkStudentClassSchema.safeParse(input);
    if (!parsed.success) {
      return { error: zodFirstMessage(parsed.error) };
    }

    const res = await apiFetchAuthed(
      `/api/clients/${clientId}/students/${studentId}/classes`,
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

export async function unlinkStudentClassAction(
  clientId: string,
  studentId: string,
  classId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const cid = ids.safeParse({ clientId });
    const sid = z.string().uuid().safeParse(studentId);
    const cid2 = z.string().uuid().safeParse(classId);
    if (!cid.success || !sid.success || !cid2.success) {
      return { error: 'Dados inválidos.' };
    }

    const res = await apiFetchAuthed(
      `/api/clients/${clientId}/students/${studentId}/classes/${classId}`,
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

export async function createStudentAction(
  clientId: string,
  input: unknown,
): Promise<{ success: true } | { error: string }> {
  try {
    const c = ids.safeParse({ clientId });
    if (!c.success) return { error: 'Cliente inválido.' };

    const parsed = createStudentSchema.safeParse(input);
    if (!parsed.success) return { error: zodFirstMessage(parsed.error) };

    const body = stripUndefined(parsed.data);
    const res = await apiFetchAuthed(`/api/clients/${clientId}/students`, {
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

export async function updateStudentAction(
  clientId: string,
  studentId: string,
  input: unknown,
): Promise<{ success: true } | { error: string }> {
  try {
    const cid = ids.safeParse({ clientId });
    const sid = z.string().uuid().safeParse(studentId);
    if (!cid.success || !sid.success) return { error: 'Dados inválidos.' };

    const parsed = updateStudentSchema.safeParse(input);
    if (!parsed.success) return { error: zodFirstMessage(parsed.error) };

    if (Object.keys(parsed.data).length === 0)
      return { error: 'Nada para atualizar.' };

    const body = stripUndefined(parsed.data);

    const res = await apiFetchAuthed(
      `/api/clients/${clientId}/students/${studentId}`,
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

export async function deleteStudentAction(
  clientId: string,
  studentId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const cid = ids.safeParse({ clientId });
    const sid = z.string().uuid().safeParse(studentId);
    if (!cid.success || !sid.success) {
      return { error: 'Dados inválidos.' };
    }

    const res = await apiFetchAuthed(
      `/api/clients/${clientId}/students/${studentId}`,
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

export async function listStudentResponsiblesAction(
  clientId: string,
  studentId: string,
): Promise<
  | { success: true; items: StudentResponsibleLinkWithResponsible[] }
  | { error: string }
> {
  try {
    const c = ids.safeParse({ clientId });
    const s = z.string().uuid().safeParse(studentId);
    if (!c.success || !s.success) {
      return { error: 'Dados inválidos.' };
    }
    const res = await apiFetchAuthed(
      `/api/clients/${c.data.clientId}/students/${s.data}/responsibles`,
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { error: nestErrorMessage(data) };
    }
    const items =
      (await parseResponseJson(res)) as StudentResponsibleLinkWithResponsible[];
    return { success: true, items: Array.isArray(items) ? items : [] };
  } catch {
    return { error: 'Sem permissão.' };
  }
}
