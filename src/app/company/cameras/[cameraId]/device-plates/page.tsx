import { redirect } from "next/navigation";

import DevicePlatesClient from "./DevicePlatesClient";
import { auth } from "@/auth";
import { can } from "@/lib/permissions";

export default async function DevicePlatesPage({
    params,
}: {
    params: Promise<{ cameraId: string }>;
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

    const resolvedParams = await params;

    return <DevicePlatesClient cameraId={resolvedParams.cameraId} />;
}
