"use client";

import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { useBlockedAttemptSocket } from "@/hooks/use-blocked-attempt-socket";

import { BlockedAttemptToast } from "./BlockedAttemptToast";

export function AccessBlockedAttemptListener() {
    const { data: session } = useSession();
    const role = session?.user?.role;
    const token =
        role === "client_admin" ||
        role === "client_operator" ||
        role === "company_admin" ||
        role === "company_operator"
            ? session?.accessToken
            : undefined;

    useBlockedAttemptSocket(token, (event) => {
        toast.custom(
            (toastId) => (
                <BlockedAttemptToast toastId={toastId} event={event} />
            ),
            {
                duration: Infinity,
                unstyled: true,
                className: "p-0! bg-transparent! border-0! shadow-none!",
            },
        );
    });

    return null;
}
