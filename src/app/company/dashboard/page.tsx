import Link from "next/link";

import { PageHeader } from "@/components/shared/PageHeader";

export default function CompanyDashboardPage() {
    return (
        <div className="space-y-4">
            <PageHeader
                title="Área da empresa"
                description="Dashboard da empresa em construção."
            />
            <Link href="/" className="text-sm underline">
                Início
            </Link>
        </div>
    );
}
