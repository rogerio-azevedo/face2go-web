import { signIn } from "next-auth/react";

import type {
    LegacyLoginResponse,
    LoginApiResponse,
    LoginResponse,
    SelectContextResponse,
    UserContext,
    UserContextType,
} from "@/types/auth-context";
import { getApiBaseUrl, nestErrorMessage, parseResponseJson } from "@/lib/api-fetch";
import type { Face2goCredentialsUser } from "@/lib/dashboard-path";

export const CONTEXTS_STORAGE_KEY = "face2go.contexts";
export const ACTIVE_CONTEXT_STORAGE_KEY = "face2go.activeContext";

export function contextStorageKey(context: UserContext): string {
    if (context.type === "super_admin" || context.type === "face_user") {
        return context.type;
    }
    return `${context.type}:${context.contextId}`;
}

export function saveContexts(contexts: UserContext[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(CONTEXTS_STORAGE_KEY, JSON.stringify(contexts));
}

export function loadContexts(): UserContext[] {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem(CONTEXTS_STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw) as UserContext[];
    } catch {
        return [];
    }
}

export function saveActiveContext(context: UserContext): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(
        ACTIVE_CONTEXT_STORAGE_KEY,
        JSON.stringify(context),
    );
}

export function loadActiveContext(): UserContext | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(ACTIVE_CONTEXT_STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as UserContext;
    } catch {
        return null;
    }
}

/** Logo do tenant ativo (empresa ou cliente), quando configurada. */
export function contextLogoUrl(context: UserContext | null | undefined): string | null {
    if (!context) return null;
    if (context.type === "company") {
        return context.logoUrl;
    }
    if (context.type === "client" || context.type === "responsible") {
        return context.branding.logoUrl;
    }
    return null;
}

export function clearContextStorage(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(CONTEXTS_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_CONTEXT_STORAGE_KEY);
}

export function selectContextPayload(context: UserContext): {
    contextType: UserContextType;
    contextId?: string;
} {
    if (context.type === "super_admin" || context.type === "face_user") {
        return { contextType: context.type };
    }
    return {
        contextType: context.type,
        contextId: context.contextId,
    };
}

export function isLegacyLoginResponse(
    data: LoginApiResponse,
): data is LegacyLoginResponse {
    return "accessToken" in data && !("identityToken" in data);
}

export async function loginWithIdentifier(
    identifier: string,
    password: string,
): Promise<LoginApiResponse> {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
    });
    const data = await parseResponseJson(res);
    if (!res.ok) {
        throw new Error(nestErrorMessage(data));
    }
    return data as LoginApiResponse;
}

export async function requestPasswordReset(identifier: string): Promise<void> {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/request-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
    });
    const data = await parseResponseJson(res);
    if (!res.ok) {
        throw new Error(nestErrorMessage(data));
    }
}

export async function resetPasswordWithToken(
    token: string,
    password: string,
): Promise<void> {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
    });
    const data = await parseResponseJson(res);
    if (!res.ok) {
        throw new Error(nestErrorMessage(data));
    }
}

export async function establishSessionFromLegacyLogin(
    input: LegacyLoginResponse,
) {
    const credentialsUser: Face2goCredentialsUser = {
        id: input.user.id,
        email: input.user.email,
        name: input.user.name ?? undefined,
        role: input.user.role as Face2goCredentialsUser["role"],
        companyId: input.user.companyId,
        clientId: input.user.clientId,
        companyUserId: input.user.companyUserId,
        clientUserId: input.user.clientUserId,
        responsibleId: input.user.responsibleId,
    };

    clearContextStorage();

    return signIn("credentials", {
        mode: "session",
        accessToken: input.accessToken,
        user: JSON.stringify(credentialsUser),
        redirect: false,
    });
}

export async function selectContextWithToken(
    token: string,
    context: UserContext,
): Promise<SelectContextResponse> {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/select-context`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectContextPayload(context)),
    });
    const data = await parseResponseJson(res);
    if (!res.ok) {
        throw new Error(nestErrorMessage(data));
    }
    return data as SelectContextResponse;
}

export async function establishSessionFromContext(input: {
    accessToken: string;
    user: SelectContextResponse["user"];
    contexts: UserContext[];
    activeContext: UserContext;
}) {
    const credentialsUser: Face2goCredentialsUser = {
        id: input.user.id,
        email: input.user.email,
        name: input.user.name ?? undefined,
        role: input.user.role as Face2goCredentialsUser["role"],
        companyId: input.user.companyId,
        clientId: input.user.clientId,
        companyUserId: input.user.companyUserId,
        clientUserId: input.user.clientUserId,
        responsibleId: input.user.responsibleId,
    };

    saveContexts(input.contexts);
    saveActiveContext(input.activeContext);

    return signIn("credentials", {
        mode: "session",
        accessToken: input.accessToken,
        user: JSON.stringify(credentialsUser),
        contexts: JSON.stringify(input.contexts),
        activeContext: JSON.stringify(input.activeContext),
        redirect: false,
    });
}
