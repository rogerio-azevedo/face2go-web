import Link from "next/link";

import { PageHeader } from "@/components/shared/PageHeader";
import { CompanyForm } from "@/components/super-admin/companies/CompanyForm";

export default function NewCompanyPage() {
    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
            <PageHeader
                title="Nova empresa"
                description="Cadastre uma nova empresa na plataforma."
            />
            <Link
                href="/super-admin/companies"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
                Voltar para empresas
            </Link>
            <CompanyForm mode="create" />
        </div>
    );
}
