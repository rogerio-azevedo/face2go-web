import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { ClientReadersTable } from "@/features/readers/components/ClientReadersTable";
import { apiFetchAuthed } from "@/lib/api-fetch";
import type { ClientReaderListRow } from "@/types/domain";

export default async function ClientReadersPage() {
    const session = await auth();
    const user = session?.user;
    const role = user?.role;

    if (!user?.clientId) {
        redirect("/login?error=Sem permissão");
    }
    if (role !== "client_admin") {
        redirect("/client/dashboard");
    }

    let readers: ClientReaderListRow[] = [];
    try {
        const res = await apiFetchAuthed("/api/client/readers");
        if (res.ok) {
            readers = (await res.json()) as ClientReaderListRow[];
        }
    } catch {
        readers = [];
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Leitores faciais"
                description="Acione a abertura remota dos leitores da sua unidade."
            />
            <ClientReadersTable readers={readers} />
        </div>
    );
}
