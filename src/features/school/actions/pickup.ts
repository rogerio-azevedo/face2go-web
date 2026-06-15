'use server';

import { z } from 'zod';

import {
  apiFetchAuthed,
  nestErrorMessage,
  parseResponseJson,
} from '@/lib/api-fetch';
import type { PickupAuthorizationRow } from '@/features/school/types';
import { clientIdSchema as ids, revalidateSchoolRoutes } from './shared';

export async function listPickupAuthorizationsAction(
  clientId: string,
): Promise<
  | { success: true; items: PickupAuthorizationRow[] }
  | { error: string }
> {
  try {
    const c = ids.safeParse({ clientId });
    if (!c.success) {
      return { error: 'Cliente inválido.' };
    }
    const res = await apiFetchAuthed(
      `/api/clients/${c.data.clientId}/pickup-authorizations`,
    );
    if (!res.ok) {
      const data = await parseResponseJson(res);
      return { error: nestErrorMessage(data) };
    }
    const items = (await parseResponseJson(res)) as PickupAuthorizationRow[];
    return { success: true, items: Array.isArray(items) ? items : [] };
  } catch {
    return { error: 'Sem permissão.' };
  }
}

export async function markUsedPickupAuthorizationAction(
  clientId: string,
  authorizationId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const c = ids.safeParse({ clientId });
    const a = z.string().uuid().safeParse(authorizationId);
    if (!c.success || !a.success) {
      return { error: 'Dados inválidos.' };
    }
    const res = await apiFetchAuthed(
      `/api/clients/${c.data.clientId}/pickup-authorizations/${a.data}/mark-used`,
      { method: 'PATCH' },
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

export async function cancelPickupAuthorizationAction(
  clientId: string,
  authorizationId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const c = ids.safeParse({ clientId });
    const a = z.string().uuid().safeParse(authorizationId);
    if (!c.success || !a.success) {
      return { error: 'Dados inválidos.' };
    }
    const res = await apiFetchAuthed(
      `/api/clients/${c.data.clientId}/pickup-authorizations/${a.data}/cancel`,
      { method: 'PATCH' },
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

export async function deletePickupAuthorizationAction(
  clientId: string,
  authorizationId: string,
): Promise<{ success: true } | { error: string }> {
  try {
    const c = ids.safeParse({ clientId });
    const a = z.string().uuid().safeParse(authorizationId);
    if (!c.success || !a.success) {
      return { error: 'Dados inválidos.' };
    }
    const res = await apiFetchAuthed(
      `/api/clients/${c.data.clientId}/pickup-authorizations/${a.data}`,
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
