import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ClientLocationReviewPanel } from "@/features/client-blocks/components/ClientLocationReviewPanel";

export default async function CompanyClientBlocksUnitsPage({
    params,
}: {
    params: Promise<{ clientId: string }>;
}) {
    const { clientId } = await params;
    const session = await auth();
    const user = session?.user;

    if (!user?.companyId) {
        redirect("/login?error=Sem permissão");
    }
    if (user.role !== "company_admin") {
        redirect("/company/dashboard");
    }

    return <ClientLocationReviewPanel clientId={clientId} />;
}
