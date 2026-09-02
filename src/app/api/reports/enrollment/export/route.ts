import { NextRequest } from 'next/server';

import { apiFetchAuthed } from '@/lib/api-fetch';

function optionalBoolParam(value: string | null): 'true' | 'false' | undefined {
  if (value === 'true' || value === 'false') return value;
  return undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const scope = params.get('scope') === 'client' ? 'client' : 'company';
  const group = params.get('group');
  const clientId = params.get('clientId');
  const classId = params.get('classId');
  const search = params.get('search');
  const hasFace = optionalBoolParam(params.get('hasFace'));
  const hasVehicle = optionalBoolParam(params.get('hasVehicle'));
  const syncFailed = optionalBoolParam(params.get('syncFailed'));

  if (
    !group ||
    !['students', 'responsibles', 'members'].includes(group)
  ) {
    return new Response('Grupo inválido.', { status: 400 });
  }
  if (scope === 'company' && !clientId) {
    return new Response('Informe o cliente.', { status: 400 });
  }

  const nestParams = new URLSearchParams();
  if (scope === 'company' && clientId) {
    nestParams.set('clientId', clientId);
  }
  nestParams.set('group', group);
  if (classId) nestParams.set('classId', classId);
  const trimmed = search?.trim();
  if (trimmed) nestParams.set('search', trimmed);
  if (hasFace) nestParams.set('hasFace', hasFace);
  if (hasVehicle) nestParams.set('hasVehicle', hasVehicle);
  if (syncFailed) nestParams.set('syncFailed', syncFailed);

  const path =
    scope === 'company'
      ? `/api/reports/enrollment/export?${nestParams.toString()}`
      : `/api/client/reports/enrollment/export?${nestParams.toString()}`;

  try {
    const res = await apiFetchAuthed(path);
    const body = await res.arrayBuffer();
    const headers = new Headers();
    headers.set(
      'Content-Type',
      res.headers.get('content-type') ?? 'text/csv; charset=utf-8',
    );
    const disposition = res.headers.get('content-disposition');
    if (disposition) {
      headers.set('Content-Disposition', disposition);
    }
    return new Response(body, { status: res.status, headers });
  } catch {
    return new Response('Não autenticado.', { status: 401 });
  }
}
