import Link from 'next/link';
import { notFound } from 'next/navigation';

import { InviteGenerator } from '@/components/super-admin/companies/InviteGenerator';
import { PageHeader } from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { apiFetchAuthed } from '@/lib/api-fetch';
import { cn } from '@/lib/utils';
import type { CompanyRow, CompanyUserListRow } from '@/types/domain';

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function SuperAdminCompanyDetailPage({ params }: PageProps) {
    const { id } = await params;

    let company: CompanyRow | null = null;
    let users: CompanyUserListRow[] = [];

    try {
        const [companyRes, usersRes] = await Promise.all([
            apiFetchAuthed(`/api/companies/${id}`),
            apiFetchAuthed(`/api/companies/${id}/users`),
        ]);

        if (companyRes.ok) {
            company = (await companyRes.json()) as CompanyRow;
        }
        if (usersRes.ok) {
            users = (await usersRes.json()) as CompanyUserListRow[];
        }
    } catch {
        company = null;
    }

    if (!company) {
        notFound();
    }

    const row = company;

    return (
        <div className="space-y-6">
            <PageHeader
                title={row.name}
                description="Links de convite e membros vinculados a esta empresa."
                actions={
                    <Link
                        href={`/super-admin/companies/${id}/edit`}
                        className={cn(buttonVariants({ variant: 'outline' }))}
                    >
                        Editar cadastro
                    </Link>
                }
            />

            <div className="grid gap-4 md:grid-cols-2">
                <InviteGenerator
                    companyId={id}
                    role="company_admin"
                    title="Convite — administrador da empresa"
                />
                <InviteGenerator
                    companyId={id}
                    role="company_operator"
                    title="Convite — operador"
                />
            </div>

            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Equipe</h2>
                {users.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        Nenhum usuário vinculado ainda. Gere um convite acima.
                    </p>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>E-mail</TableHead>
                                    <TableHead>Cargo</TableHead>
                                    <TableHead>Papel</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((row) => (
                                    <TableRow key={row.companyUserId}>
                                        <TableCell className="font-medium">
                                            {row.name ?? '—'}
                                        </TableCell>
                                        <TableCell>{row.email}</TableCell>
                                        <TableCell>{row.jobTitle ?? '—'}</TableCell>
                                        <TableCell>
                                            {row.role === 'company_admin'
                                                ? 'Administrador'
                                                : 'Operador'}
                                        </TableCell>
                                        <TableCell>
                                            {row.isActive ? (
                                                <Badge>Ativo</Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Inativo
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
