import { redirect } from "next/navigation";

import { auth } from "@/auth";
import DeviceUsersClient from "./DeviceUsersClient";
import { apiFetchAuthed } from "@/lib/api-fetch";
import { can } from "@/lib/permissions";
import type { ReaderListRow } from "@/types/domain";

export default async function DeviceUsersPage({
    params,
}: {
    params: Promise<{ readerId: string }>;
}) {
    const session = await auth();
    const user = session?.user;

    if (!user?.companyId) {
        redirect("/login?error=Sem permissão");
    }

    const role = user.role;
    const canAccess =
        role === "company_admin" ||
        (role === "company_operator" && (await can("clients", "can_read")));

    if (!canAccess) {
        redirect("/company/dashboard");
    }

    const { readerId } = await params;
    let readerName: string | undefined;
    try {
        const res = await apiFetchAuthed("/api/readers");
        if (res.ok) {
            const readers = (await res.json()) as ReaderListRow[];
            readerName = readers.find((r) => r.id === readerId)?.name;
        }
    } catch {
        readerName = undefined;
    }

    return <DeviceUsersClient readerId={readerId} readerName={readerName} />;
}
