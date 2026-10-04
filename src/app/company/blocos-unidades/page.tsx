import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PageHeader } from "@/components/shared/PageHeader";
import { listLocationReviewAction } from "@/features/client-blocks/actions";
import { LocationReviewOverview } from "@/features/client-blocks/components/LocationReviewOverview";

export default async function CompanyBlocksUnitsPage() {
    const session = await auth();
    const user = session?.user;

    if (!user?.companyId) {
        redirect("/login?error=Sem permissão");
    }
    if (user.role !== "company_admin") {
        redirect("/company/dashboard");
    }

    const result = await listLocationReviewAction();

    return (
        <div className="space-y-6">
            <PageHeader
                title="Blocos e unidades"
                description="Veja, por condomínio, quem ainda tem bloco e unidade só em texto e vincule ao catálogo."
            />
            {"error" in result ? (
                <p className="text-destructive text-sm">{result.error}</p>
            ) : (
                <LocationReviewOverview items={result.items} />
            )}
        </div>
    );
}
