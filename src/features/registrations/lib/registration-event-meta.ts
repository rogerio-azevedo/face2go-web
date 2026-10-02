import {
    Ban,
    Check,
    LockOpen,
    RotateCcw,
    StickyNote,
    Trash2,
    X,
    type LucideIcon,
} from "lucide-react";

import type { RegistrationEvent } from "@/features/registrations/types/events";

export const REGISTRATION_EVENT_META: Record<
    RegistrationEvent["type"],
    { label: string; icon: LucideIcon }
> = {
    note: { label: "Anotação", icon: StickyNote },
    approved: { label: "Aprovado", icon: Check },
    rejected: { label: "Rejeitado", icon: X },
    blocked: { label: "Bloqueado", icon: Ban },
    unblocked: { label: "Desbloqueado", icon: LockOpen },
    deleted: { label: "Excluído", icon: Trash2 },
    restored: { label: "Restaurado", icon: RotateCcw },
};
