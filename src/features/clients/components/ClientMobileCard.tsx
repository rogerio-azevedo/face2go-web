"use client";

import { MonitorPlay } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    CLIENT_TYPE_LABELS,
    type ClientType,
} from "@/lib/validations/clients";
import { cn } from "@/lib/utils";
import type { ClientListRow } from "@/types/domain";

type ClientMobileCardProps = {
    client: ClientListRow;
    canManage: boolean;
    showDisplayPanel: boolean;
    pending: boolean;
    onToggleActive: (clientId: string, isActive: boolean) => void;
    onOpenDisplay: (client: ClientListRow) => void;
    onOpenEdit: (client: ClientListRow) => void;
};

export function ClientMobileCard({
    client,
    canManage,
    showDisplayPanel,
    pending,
    onToggleActive,
    onOpenDisplay,
    onOpenEdit,
}: ClientMobileCardProps) {
    const nameId = `client-${client.id}-name`;
    const type =
        CLIENT_TYPE_LABELS[client.type as ClientType] ?? client.type;

    return (
        <article
            aria-labelledby={nameId}
            className="bg-card rounded-lg border p-4 shadow-xs"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h2
                        id={nameId}
                        className="text-foreground font-semibold break-words"
                    >
                        {client.name}
                    </h2>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                        {type}
                        {client.segment === "condo_market"
                            ? " · Mercado em condomínio"
                            : ""}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {canManage ? (
                        <Switch
                            checked={client.isActive}
                            disabled={pending}
                            aria-label={`${client.isActive ? "Desativar" : "Ativar"} cliente ${client.name}`}
                            onCheckedChange={(checked) =>
                                onToggleActive(client.id, checked === true)
                            }
                        />
                    ) : null}
                    {client.isActive ? (
                        <Badge>Ativo</Badge>
                    ) : (
                        <Badge variant="secondary">Inativo</Badge>
                    )}
                </div>
            </div>

            {client.cnpj || client.phone || client.email ? (
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    {client.cnpj ? (
                        <div className="min-w-0">
                            <dt className="text-muted-foreground text-xs">
                                CNPJ
                            </dt>
                            <dd className="mt-0.5">{client.cnpj}</dd>
                        </div>
                    ) : null}
                    {client.phone ? (
                        <div className="min-w-0">
                            <dt className="text-muted-foreground text-xs">
                                Telefone
                            </dt>
                            <dd className="mt-0.5">{client.phone}</dd>
                        </div>
                    ) : null}
                    {client.email ? (
                        <div className="min-w-0 sm:col-span-2">
                            <dt className="text-muted-foreground text-xs">
                                E-mail
                            </dt>
                            <dd className="mt-0.5 break-all">{client.email}</dd>
                        </div>
                    ) : null}
                </dl>
            ) : null}

            <div className="mt-4 space-y-2 border-t pt-4">
                <Link
                    href={`/company/clientes/${client.id}/usuarios`}
                    aria-label={`Abrir cliente ${client.name}`}
                    aria-disabled={pending}
                    tabIndex={pending ? -1 : 0}
                    className={cn(
                        buttonVariants({ size: "lg" }),
                        "w-full",
                        pending && "pointer-events-none opacity-50",
                    )}
                >
                    Abrir cliente
                </Link>

                {showDisplayPanel || canManage ? (
                    <div
                        className={cn(
                            "grid gap-2",
                            showDisplayPanel && canManage
                                ? "grid-cols-2"
                                : "grid-cols-1",
                        )}
                    >
                        {showDisplayPanel ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                className="gap-1 text-teal-600 hover:text-teal-700"
                                disabled={pending}
                                aria-label={`Abrir display do cliente ${client.name}`}
                                onClick={() => onOpenDisplay(client)}
                            >
                                <MonitorPlay className="size-4" aria-hidden />
                                Display
                            </Button>
                        ) : null}
                        {canManage ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                disabled={pending}
                                aria-label={`Editar cliente ${client.name}`}
                                onClick={() => onOpenEdit(client)}
                            >
                                Editar
                            </Button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </article>
    );
}
