import Link from "next/link";

import { PageHeader } from "@/components/shared/PageHeader";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { listCompanies } from "@/db/queries/companies";
import { cn } from "@/lib/utils";

export default async function SuperAdminDashboardPage() {
    const rows = await listCompanies({ includeInactive: true });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Painel super admin"
                description="Visão geral das empresas cadastradas na plataforma."
                actions={
                    <>
                        <Link
                            href="/super-admin/companies"
                            className={cn(buttonVariants({ variant: "outline" }))}
                        >
                            Gerenciar empresas
                        </Link>
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
                    Nenhuma empresa cadastrada ainda.{" "}
                    <Link
                        href="/super-admin/companies/new"
                        className="text-primary underline"
                    >
                        Cadastre a primeira empresa
                    </Link>
                    .
                </p>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {rows.map((company) => (
                        <li key={company.id}>
                            <Link
                                href={`/super-admin/companies/${company.id}/edit`}
                                className="block rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <Card className="h-full transition-colors hover:bg-muted/40">
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            {company.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        {company.isActive ? (
                                            <span>Ativa</span>
                                        ) : (
                                            <span>Inativa</span>
                                        )}
                                        <span className="mx-1">·</span>
                                        <span>{company.slug ?? "—"}</span>
                                    </CardContent>
                                </Card>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
