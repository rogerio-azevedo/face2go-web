import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/PageHeader";
import { CompanyForm } from "@/components/super-admin/companies/CompanyForm";
import { getCompanyById } from "@/db/queries/companies";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function EditCompanyPage({ params }: PageProps) {
    const { id } = await params;
    const company = await getCompanyById(id);

    if (!company) {
        notFound();
    }

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
            <PageHeader
                title="Editar empresa"
                description={company.name}
            />
            <Link
                href="/super-admin/companies"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
                Voltar para empresas
            </Link>
            <CompanyForm
                mode="edit"
                companyId={company.id}
                initialValues={{
                    name: company.name,
                    cnpj: company.cnpj ?? undefined,
                    phone: company.phone ?? undefined,
                    email: company.email ?? undefined,
                    logoUrl: company.logoUrl ?? undefined,
                    isActive: company.isActive,
                }}
            />
        </div>
    );
}
