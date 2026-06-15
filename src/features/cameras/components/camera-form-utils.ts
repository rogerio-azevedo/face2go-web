import type { CameraFormPayload } from '@/lib/validations/cameras';

export const cameraFieldLabel =
  'text-muted-foreground text-xs font-semibold uppercase tracking-wider';
export const cameraControlClass =
  'shadow-sm aria-invalid:border-destructive aria-invalid:ring-destructive/25 sm:h-10';
export const cameraHintClass =
  'font-normal lowercase normal-case tracking-normal text-muted-foreground';

export function toCreateCameraApiBody(data: CameraFormPayload) {
  const body: Record<string, unknown> = {
    clientId: data.clientId,
    type: data.type,
    brand: data.brand,
    name: data.name,
    description: data.description,
    ip: data.ip,
    port: data.port,
    serialNumber: data.serialNumber,
    model: data.model,
    location: data.location,
    deviceId: data.deviceId,
    isActive: data.isActive,
  };
  if (data.type === 'lpr' && data.direction !== '') {
    body.direction = data.direction;
  }
  const u = data.username.trim();
  if (u) body.username = u;
  if (data.password.length > 0) body.password = data.password;
  return body;
}

export function toUpdateCameraApiBody(
  data: CameraFormPayload,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    clientId: data.clientId,
    type: data.type,
    brand: data.brand,
    name: data.name,
    description: data.description ?? null,
    ip: data.ip,
    port: data.port,
    serialNumber: data.serialNumber ?? null,
    model: data.model ?? null,
    location: data.location ?? null,
    deviceId: data.deviceId ?? null,
    isActive: data.isActive,
    username: data.username.trim() ? data.username.trim() : null,
  };
  if (data.type === 'lpr') {
    body.direction = data.direction === '' ? null : data.direction;
  } else {
    body.direction = null;
  }
  if (data.password.length > 0) body.password = data.password;
  return body;
}
