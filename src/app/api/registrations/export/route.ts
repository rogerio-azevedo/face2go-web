import { NextRequest } from 'next/server';

import { apiFetchAuthed } from '@/lib/api-fetch';

const EXPORT_STATUSES = [
  'draft',
  'approved',
  'rejected',
  'blocked',
  'deleted',
  'all',
] as const;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const scope = params.get('scope') === 'client' ? 'client' : 'company';
  const clientId = params.get('clientId');
  const status = params.get('status');
  const search = params.get('search');
  const block = params.get('block');
  const unit = params.get('unit');
  const room = params.get('room');

  if (
    !status ||
    !EXPORT_STATUSES.includes(status as (typeof EXPORT_STATUSES)[number])
  ) {
    return new Response('Status inválido.', { status: 400 });
  }
  if (scope === 'company' && !clientId) {
    return new Response('Informe o cliente.', { status: 400 });
  }

  const nestParams = new URLSearchParams();
  nestParams.set('status', status);
  const trimmed = search?.trim();
  if (trimmed) nestParams.set('search', trimmed);
  const blockTrimmed = block?.trim();
  if (blockTrimmed) nestParams.set('block', blockTrimmed);
  const unitTrimmed = unit?.trim();
  if (unitTrimmed) nestParams.set('unit', unitTrimmed);
  const roomTrimmed = room?.trim();
  if (roomTrimmed) nestParams.set('room', roomTrimmed);

  const path =
    scope === 'company'
      ? `/api/clients/${clientId}/registrations/export?${nestParams.toString()}`
      : `/api/client/registrations/export?${nestParams.toString()}`;

  try {
    const res = await apiFetchAuthed(path);
    const body = await res.arrayBuffer();
    const headers = new Headers();
    headers.set(
      'Content-Type',
      res.headers.get('content-type') ??
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
