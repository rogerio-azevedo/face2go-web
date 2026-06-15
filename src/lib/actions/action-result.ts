export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

export function actionSuccess<T = void>(data?: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionFailure(error: string): ActionResult<never> {
  return { ok: false, error };
}
