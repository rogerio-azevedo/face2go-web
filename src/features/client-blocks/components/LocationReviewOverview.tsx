import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import type { LocationReviewSummaryRow } from "../types";

export function LocationReviewOverview({
    items,
}: {
    items: LocationReviewSummaryRow[];
}) {
    if (items.length === 0) {
        return (
            <p className="text-muted-foreground text-sm">
                Nenhum cliente do tipo condomínio.
            </p>
        );
    }

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Condomínio</TableHead>
                        <TableHead className="text-right">
                            Unidades no catálogo
                        </TableHead>
                        <TableHead className="text-right">Vinculados</TableHead>
                        <TableHead className="text-right">Só texto</TableHead>
                        <TableHead className="text-right">
                            Sem localização
                        </TableHead>
                        <TableHead className="text-right">
                            Grupos pendentes
                        </TableHead>
                        <TableHead />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.clientId}>
                            <TableCell className="font-medium">
                                <span className="flex items-center gap-2">
                                    {item.name}
                                    {!item.isActive ? (
                                        <Badge variant="secondary">Inativo</Badge>
                                    ) : null}
                                </span>
                            </TableCell>
                            <TableCell className="text-right">
                                {item.activeUnits}
                            </TableCell>
                            <TableCell className="text-right">
                                {item.linked}
                            </TableCell>
                            <TableCell className="text-right">
                                {item.textOnly}
                            </TableCell>
                            <TableCell className="text-right">
                                {item.noLocation}
                            </TableCell>
                            <TableCell className="text-right">
                                {item.groups > 0 ? (
                                    <Badge variant="outline">{item.groups}</Badge>
                                ) : (
                                    "0"
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                <Link
                                    href={`/company/blocos-unidades/${item.clientId}`}
                                    className={buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                    })}
                                >
                                    Revisar
                                </Link>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
