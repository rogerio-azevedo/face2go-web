"use client";

import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { useReaderOfflineSocket } from "@/hooks/use-reader-offline-socket";

export function ReaderOfflineAlertListener() {
    const { data: session } = useSession();
    const role = session?.user?.role;
    const token =
        role === "client_admin" || role === "client_operator"
            ? session?.accessToken
            : undefined;

    useReaderOfflineSocket(token, (event) => {
        toast.error(`Leitor ${event.readerName} está offline`, {
            description: event.clientName,
        });
    });

    return null;
}
