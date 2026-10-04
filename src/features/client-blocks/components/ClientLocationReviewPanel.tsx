"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deferInEffect } from "@/lib/defer-in-effect";

import { getClientLocationReviewAction } from "../actions";
import type { ClientLocationReview } from "../types";
import { LinkedGroupsList } from "./LinkedGroupsList";
import { PeopleList } from "./LocationGroupCard";
import { UnlinkedGroupsList } from "./UnlinkedGroupsList";

export function ClientLocationReviewPanel({
    clientId,
    reloadKey = 0,
    onCatalogChange,
}: {
    clientId: string;
    reloadKey?: number;
    onCatalogChange?: () => void;
}) {
    const [review, setReview] = useState<ClientLocationReview | null>(null);
    const [loading, setLoading] = useState(true);

    async function reload() {
        const result = await getClientLocationReviewAction(clientId);
        if ("error" in result) toast.error(result.error);
        else setReview(result.review);
    }

    useEffect(() => {
        deferInEffect(() => {
            void (async () => {
                const result = await getClientLocationReviewAction(clientId);
                if ("error" in result) toast.error(result.error);
                else setReview(result.review);
                setLoading(false);
            })();
        });
    }, [clientId, reloadKey]);

    if (loading || !review) return null;

    const unlinkedTotal = review.summary.textOnly + review.summary.noLocation;

    return (
        <section className="space-y-4 border-t pt-6">
            <div>
                <h2 className="text-lg font-semibold">
                    Ajustar bloco e unidade das pessoas
                </h2>
                <p className="text-muted-foreground text-sm">
                    Vincule textos antigos ao catálogo ou mova quem está no
                    bloco/unidade errado. A unidade de origem fica inativa e
                    pode ser excluída depois.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">
                    {review.summary.linked} vinculados
                </Badge>
                <Badge variant="outline">
                    {review.summary.textOnly} só texto
                </Badge>
                <Badge variant="outline">
                    {review.summary.noLocation} sem localização
                </Badge>
            </div>

            {review.catalog.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                    Este condomínio ainda não tem blocos ativos. Crie no grupo
                    abaixo com &quot;Criar no catálogo&quot; ou no catálogo
                    acima.
                </p>
            ) : null}

            <Tabs defaultValue={unlinkedTotal > 0 ? "unlinked" : "linked"}>
                <TabsList>
                    <TabsTrigger value="unlinked">
                        Sem vínculo ({review.groups.length})
                    </TabsTrigger>
                    <TabsTrigger value="linked">
                        Vinculados ({review.summary.linkedGroups})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="unlinked" forceMount className="space-y-4">
                    <UnlinkedGroupsList
                        clientId={clientId}
                        review={review}
                        reload={reload}
                        onCatalogChange={onCatalogChange}
                    />
                    {review.noLocation.registrations +
                        review.noLocation.members >
                    0 ? (
                        <section className="space-y-2 rounded-lg border p-4">
                            <h2 className="font-semibold">Sem localização</h2>
                            <p className="text-muted-foreground text-sm">
                                {review.noLocation.registrations} cadastro(s) e{" "}
                                {review.noLocation.members} membro(s) sem bloco
                                e sem unidade. Ajuste um a um no cadastro do
                                cliente.
                            </p>
                            <PeopleList
                                people={review.noLocation.people}
                                total={
                                    review.noLocation.registrations +
                                    review.noLocation.members
                                }
                            />
                        </section>
                    ) : null}
                </TabsContent>

                <TabsContent value="linked" forceMount>
                    <LinkedGroupsList
                        clientId={clientId}
                        review={review}
                        reload={reload}
                        onCatalogChange={onCatalogChange}
                    />
                </TabsContent>
            </Tabs>
        </section>
    );
}
