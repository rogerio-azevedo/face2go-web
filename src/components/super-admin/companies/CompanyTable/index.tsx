"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { CompanyRow } from "@/types/domain";

import { DeleteCompanyButton } from "../DeleteCompanyButton";

type CompanyTableProps = {
    companies: CompanyRow[];
};

function formatDate(d: Date | string) {
    try {
        const date = typeof d === "string" ? new Date(d) : d;
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    } catch {
        return "—";
    }
}

export function CompanyTable({ companies: rows }: CompanyTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CNPJ</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.map((company) => (
                        <TableRow key={company.id}>
                            <TableCell className="font-medium">
                                <Link
                                    href={`/super-admin/companies/${company.id}`}
                                    className="text-primary underline-offset-4 hover:underline"
                                >
                                    {company.name}
                                </Link>
                            </TableCell>
                            <TableCell>{company.cnpj ?? "—"}</TableCell>
                            <TableCell>{company.email ?? "—"}</TableCell>
                            <TableCell>
                                {company.isActive ? (
                                    <Badge variant="default">Ativa</Badge>
                                ) : (
                                    <Badge variant="secondary">Inativa</Badge>
                                )}
                            </TableCell>
                            <TableCell>{formatDate(company.createdAt)}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <ButtonLink
                                    href={`/super-admin/companies/${company.id}`}
                                >
                                    Convites
                                </ButtonLink>
                                <ButtonLinkEdit id={company.id} />
                                <DeleteCompanyButton
                                    companyId={company.id}
                                    companyName={company.name}
                                    disabled={!company.isActive}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function ButtonLinkEdit({ id }: { id: string }) {
    return (
        <ButtonLink href={`/super-admin/companies/${id}/edit`}>Editar</ButtonLink>
    );
}

/** Link estilo botão discreto sem depender do componente Button (compatível com agrupamentos em células). */
function ButtonLink({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-xs font-medium transition-colors hover:bg-muted"
        >
            {children}
        </Link>
    );
}
