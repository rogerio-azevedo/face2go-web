"use client";

import { CompanyClientRegistrationLinksPanel } from "@/components/company/clientes/CompanyClientRegistrationLinksPanel";
import { ClientAddressesPanel } from "@/components/company/clientes/enderecos/ClientAddressesPanel";
import { SchoolTab } from "@/components/company/clientes/escola/SchoolTab";
import { RegistrationsReviewBoard } from "@/components/registrations/RegistrationsReviewBoard";
import { DeviceSyncQueuePanel } from "@/features/device-sync/components/DeviceSyncQueuePanel";
import { RegistrationFieldsConfigPanel } from "@/features/registrations/components/RegistrationFieldsConfigPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ClientDetailTabsProps = {
    clientId: string;
    clientType: string;
    clientName?: string;
    isAdmin?: boolean;
    canEditAddresses?: boolean;
};

export function ClientDetailTabs({
    clientId,
    clientType,
    clientName = "Cliente",
    isAdmin = false,
    canEditAddresses = false,
}: ClientDetailTabsProps) {
    const isSchool = clientType === "school";

    if (isSchool) {
        return (
            <SchoolTab
                clientId={clientId}
                isAdmin={isAdmin}
                canEditAddresses={canEditAddresses}
            />
        );
    }

    return (
        <Tabs defaultValue="requests">
            <TabsList className="w-full justify-start md:w-fit">
                <TabsTrigger value="requests">
                    Solicitações recebidas
                </TabsTrigger>
                <TabsTrigger value="links">Links de cadastro</TabsTrigger>
                <TabsTrigger value="registration-config">
                    Campos do cadastro
                </TabsTrigger>
                <TabsTrigger value="addresses">Endereços</TabsTrigger>
                {isAdmin ? (
                    <TabsTrigger value="sync-queue">Fila de sync</TabsTrigger>
                ) : null}
            </TabsList>

            <TabsContent value="requests" className="space-y-4">
                <RegistrationsReviewBoard
                    variant="company"
                    companyClientId={clientId}
                    isAdmin={isAdmin}
                    clientType={clientType}
                />
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
                <p className="text-muted-foreground text-sm">
                    Gere links públicos e copie quando precisar. As solicitações
                    ficam na aba &quot;Solicitações recebidas&quot;.
                </p>
                <CompanyClientRegistrationLinksPanel
                    clientId={clientId}
                    clientName={clientName}
                />
            </TabsContent>

            <TabsContent value="registration-config" className="space-y-4">
                <RegistrationFieldsConfigPanel
                    clientId={clientId}
                    clientType={clientType}
                />
            </TabsContent>

            <TabsContent value="addresses" className="space-y-4">
                <ClientAddressesPanel
                    clientId={clientId}
                    canEdit={canEditAddresses}
                />
            </TabsContent>

            {isAdmin ? (
                <TabsContent value="sync-queue" className="space-y-4">
                    <DeviceSyncQueuePanel clientId={clientId} />
                </TabsContent>
            ) : null}
        </Tabs>
    );
}
