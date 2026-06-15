import { startTransition, type TransitionFunction } from "react";

/** Evita setState síncrono em useEffect (react-hooks/set-state-in-effect). */
export function deferInEffect(update: TransitionFunction) {
    queueMicrotask(() => startTransition(update));
}
