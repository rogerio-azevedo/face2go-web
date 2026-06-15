'use server';

import { z } from 'zod';

import { auth } from '@/auth';
import {
  apiFetchAuthed,
  getApiBaseUrl,
  nestErrorMessage,
  parseResponseJson,
} from '@/lib/api-fetch';
import { revalidateSchoolRoutes } from './shared';

export async function syncStudentFaceAction(
  clientId: string,
  studentId: string,
): Promise<
  | {
      success: true;
      deviceSyncStatus: string;
      deviceSyncError: string | null;
    }
  | { error: string }
> {
  const cid = z.string().uuid().safeParse(clientId);
  const sid = z.string().uuid().safeParse(studentId);
  if (!cid.success || !sid.success) return { error: 'ID inválido.' };
  try {
    const res = await apiFetchAuthed(
      `/api/clients/${cid.data}/students/${sid.data}/face/sync`,
      { method: 'POST' },
    );
    const data = (await parseResponseJson(res)) as {
      deviceSyncStatus?: string;
      deviceSyncError?: string | null;
    };
    if (!res.ok) return { error: nestErrorMessage(data) };
    revalidateSchoolRoutes(clientId);
    return {
      success: true,
      deviceSyncStatus: String(data.deviceSyncStatus ?? ''),
      deviceSyncError: data.deviceSyncError ?? null,
    };
  } catch {
    return { error: 'Sem permissão.' };
  }
}

export async function syncResponsibleFaceAction(
  clientId: string,
  responsibleId: string,
): Promise<
  | {
      success: true;
      deviceSyncStatus: string;
      deviceSyncError: string | null;
    }
  | { error: string }
> {
  const cid = z.string().uuid().safeParse(clientId);
  const rid = z.string().uuid().safeParse(responsibleId);
  if (!cid.success || !rid.success) return { error: 'ID inválido.' };
  try {
    const res = await apiFetchAuthed(
      `/api/clients/${cid.data}/responsibles/${rid.data}/face/sync`,
      { method: 'POST' },
    );
    const data = (await parseResponseJson(res)) as {
      deviceSyncStatus?: string;
      deviceSyncError?: string | null;
    };
    if (!res.ok) return { error: nestErrorMessage(data) };
    revalidateSchoolRoutes(clientId);
    return {
      success: true,
      deviceSyncStatus: String(data.deviceSyncStatus ?? ''),
      deviceSyncError: data.deviceSyncError ?? null,
    };
  } catch {
    return { error: 'Sem permissão.' };
  }
}

export async function getStudentsGlobalFaceSyncSseUrlAction(
  clientId: string,
): Promise<{ url: string } | { error: string }> {
  const cid = z.string().uuid().safeParse(clientId);
  if (!cid.success) return { error: 'Cliente inválido.' };
  try {
    const session = await auth();
    const token = session?.accessToken;
    if (!token) return { error: 'Não autenticado.' };
    const base = getApiBaseUrl();
    const url = `${base}/api/clients/${cid.data}/students/face/global-sync/progress?token=${encodeURIComponent(token)}`;
    return { url };
  } catch {
    return { error: 'Não autenticado.' };
  }
}

export async function getResponsiblesGlobalFaceSyncSseUrlAction(
  clientId: string,
): Promise<{ url: string } | { error: string }> {
  const cid = z.string().uuid().safeParse(clientId);
  if (!cid.success) return { error: 'Cliente inválido.' };
  try {
    const session = await auth();
    const token = session?.accessToken;
    if (!token) return { error: 'Não autenticado.' };
    const base = getApiBaseUrl();
    const url = `${base}/api/clients/${cid.data}/responsibles/face/global-sync/progress?token=${encodeURIComponent(token)}`;
    return { url };
  } catch {
    return { error: 'Não autenticado.' };
  }
}
