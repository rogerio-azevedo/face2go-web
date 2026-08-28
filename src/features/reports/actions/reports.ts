'use server';

import { zodFirstMessage } from '@/lib/actions/zod-utils';
import {
  apiFetchAuthed,
  nestErrorMessage,
  parseResponseJson,
} from '@/lib/api-fetch';
import { enrollmentReportFiltersSchema } from '@/features/reports/validations';
import type {
  EnrollmentListResult,
  EnrollmentSummary,
} from '@/features/reports/types';

function buildQuery(
  data: {
    scope: 'company' | 'client';
    clientId?: string;
    group: string;
    classId?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  },
  includePagination: boolean,
): string {
  const sp = new URLSearchParams();
  if (data.scope === 'company' && data.clientId) {
    sp.set('clientId', data.clientId);
  }
  sp.set('group', data.group);
  if (data.classId) sp.set('classId', data.classId);
  const search = data.search?.trim();
  if (search) sp.set('search', search);
  if (includePagination) {
    sp.set('page', String(data.page ?? 1));
    sp.set('pageSize', String(data.pageSize ?? 20));
  }
  return sp.toString();
}

function basePath(scope: 'company' | 'client'): string {
  return scope === 'company' ? '/api/reports' : '/api/client/reports';
}

export async function getEnrollmentSummaryAction(
  input: unknown,
): Promise<{ ok: true; data: EnrollmentSummary } | { ok: false; error: string }> {
  const parsed = enrollmentReportFiltersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: zodFirstMessage(parsed.error) };
  }
  if (parsed.data.scope === 'company' && !parsed.data.clientId) {
    return { ok: false, error: 'Informe o cliente.' };
  }

  try {
    const qs = buildQuery(parsed.data, false);
    const res = await apiFetchAuthed(
      `${basePath(parsed.data.scope)}/enrollment/summary?${qs}`,
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { ok: false, error: nestErrorMessage(data) };
    }
    const data = (await parseResponseJson(res)) as EnrollmentSummary;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Sem permissão.' };
  }
}

export async function getEnrollmentListAction(
  input: unknown,
): Promise<
  { ok: true; data: EnrollmentListResult } | { ok: false; error: string }
> {
  const parsed = enrollmentReportFiltersSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: zodFirstMessage(parsed.error) };
  }
  if (parsed.data.scope === 'company' && !parsed.data.clientId) {
    return { ok: false, error: 'Informe o cliente.' };
  }

  try {
    const qs = buildQuery(parsed.data, true);
    const res = await apiFetchAuthed(
      `${basePath(parsed.data.scope)}/enrollment/list?${qs}`,
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { ok: false, error: nestErrorMessage(data) };
    }
    const data = (await parseResponseJson(res)) as EnrollmentListResult;
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'Sem permissão.' };
  }
}
