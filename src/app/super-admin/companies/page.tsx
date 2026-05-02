import Link from "next/link";

import { PageHeader } from "@/components/shared/PageHeader";
import { CompanyTable } from "@/components/super-admin/companies/CompanyTable";
import { buttonVariants } from "@/components/ui/button";
import { listCompanies } from "@/db/queries/companies";
import { cn } from "@/lib/utils";

type PageProps = {
    searchParams: Promise<{ all?: string }>;
};

export default async function SuperAdminCompaniesPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const includeInactive = sp.all === "1";
    const rows = await listCompanies({ includeInactive });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Empresas"
                description="Cadastro e manutenção de empresas da plataforma."
                actions={
                    <>
                        {includeInactive ? (
                            <Link
                                href="/super-admin/companies"
                                className={cn(buttonVariants({ variant: "outline" }))}
                            >
                                Somente ativas
                            </Link>
                        ) : (
                            <Link
                                href="/super-admin/companies?all=1"
                                className={cn(buttonVariants({ variant: "outline" }))}
                            >
                                Incluir inativas
                            </Link>
                        )}
                        <Link
                            href="/super-admin/companies/new"
                            className={cn(buttonVariants())}
                        >
                            Nova empresa
                        </Link>
                    </>
                }
            />

            {rows.length === 0 ? (
                <p className="text-muted-foreground">
                    Nenhuma empresa encontrada nesta lista.{" "}
                    <Link
                        href="/super-admin/companies/new"
                        className="text-primary underline"
                    >
                        Cadastre a primeira
                    </Link>
                    .
                </p>
            ) : (
                <CompanyTable companies={rows} />
            )}
        </div>
    );
}
