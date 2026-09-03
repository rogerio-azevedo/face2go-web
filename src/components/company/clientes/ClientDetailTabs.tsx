"use client";

import { CompanyClientRegistrationLinksPanel } from "@/components/company/clientes/CompanyClientRegistrationLinksPanel";
import { ClientAddressesPanel } from "@/components/company/clientes/enderecos/ClientAddressesPanel";
import { SchoolTab } from "@/components/company/clientes/escola/SchoolTab";
import { RegistrationsReviewBoard } from "@/components/registrations/RegistrationsReviewBoard";
import { RegistrationsFaceSyncAllModal } from "@/features/registrations/components/RegistrationsFaceSyncAllModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type ClientDetailTabsProps = {
    clientId: string;
    clientType: string;
    isAdmin?: boolean;
    canEditAddresses?: boolean;
};

export function ClientDetailTabs({
    clientId,
    clientType,
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
                <TabsTrigger value="addresses">Endereços</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <RegistrationsFaceSyncAllModal
                        variant="company"
                        companyClientId={clientId}
                    />
                </div>
                <RegistrationsReviewBoard
                    variant="company"
                    companyClientId={clientId}
                />
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
                <p className="text-muted-foreground text-sm">
                    Gere links públicos e copie quando precisar. As solicitações
                    ficam na aba &quot;Solicitações recebidas&quot;.
                </p>
                <CompanyClientRegistrationLinksPanel clientId={clientId} />
            </TabsContent>

            <TabsContent value="addresses" className="space-y-4">
                <ClientAddressesPanel
                    clientId={clientId}
                    canEdit={canEditAddresses}
                />
            </TabsContent>
        </Tabs>
    );
}
