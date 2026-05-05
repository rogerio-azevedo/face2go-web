import { redirect } from "next/navigation";

import { auth } from "@/auth";
import DeviceUsersClient from "./DeviceUsersClient";
import { can } from "@/lib/permissions";

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

    // Since this is Next.js 15+ App router, params is a Promise
    const resolvedParams = await params;

    return <DeviceUsersClient readerId={resolvedParams.readerId} />;
}
