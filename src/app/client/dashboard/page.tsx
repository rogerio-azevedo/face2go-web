import Link from "next/link";

import { PageHeader } from "@/components/shared/PageHeader";

export default function ClientDashboardPage() {
    return (
        <div className="space-y-4">
            <PageHeader
                title="Área do cliente"
                description="Dashboard do cliente em construção."
            />
            <Link href="/" className="text-sm underline">
                Início
            </Link>
        </div>
    );
}
