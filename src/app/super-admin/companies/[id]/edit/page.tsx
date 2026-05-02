import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/shared/PageHeader';
import { CompanyForm } from '@/components/super-admin/companies/CompanyForm';
import { apiFetchAuthed } from '@/lib/api-fetch';
import type { CompanyRow } from '@/types/domain';

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function EditCompanyPage({ params }: PageProps) {
    const { id } = await params;

    let company: CompanyRow | null = null;
    try {
        const res = await apiFetchAuthed(`/api/companies/${id}`);
        if (res.ok) {
            company = (await res.json()) as CompanyRow;
        }
    } catch {
        company = null;
    }

    if (!company) {
        notFound();
    }

    const row = company;

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
            <PageHeader title="Editar empresa" description={row.name} />
            <Link
                href="/super-admin/companies"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
                Voltar para empresas
            </Link>
            <CompanyForm
                mode="edit"
                companyId={row.id}
                initialValues={{
                    name: row.name,
                    cnpj: row.cnpj ?? undefined,
                    phone: row.phone ?? undefined,
                    email: row.email ?? undefined,
                    logoUrl: row.logoUrl ?? undefined,
                    isActive: row.isActive,
                }}
            />
        </div>
    );
}
