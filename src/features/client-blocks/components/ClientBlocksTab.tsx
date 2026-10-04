"use client";

import { useState } from "react";

import { ClientBlocksPanel } from "./ClientBlocksPanel";
import { ClientLocationReviewPanel } from "./ClientLocationReviewPanel";

export function ClientBlocksTab({
    clientId,
    isAdmin = false,
}: {
    clientId: string;
    isAdmin?: boolean;
}) {
    const [catalogReloadKey, setCatalogReloadKey] = useState(0);
    const [reviewReloadKey, setReviewReloadKey] = useState(0);

    return (
        <div className="space-y-6">
            <ClientBlocksPanel
                clientId={clientId}
                reloadKey={catalogReloadKey}
                onChange={() => setReviewReloadKey((value) => value + 1)}
                canMovePeople={isAdmin}
            />
            {isAdmin ? (
                <ClientLocationReviewPanel
                    clientId={clientId}
                    reloadKey={reviewReloadKey}
                    onCatalogChange={() =>
                        setCatalogReloadKey((value) => value + 1)
                    }
                />
            ) : null}
        </div>
    );
}
