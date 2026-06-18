"use client";

import { CompanyClientRegistrationLinksPanel } from "@/components/company/clientes/CompanyClientRegistrationLinksPanel";
import { ClientAddressesPanel } from "@/components/company/clientes/enderecos/ClientAddressesPanel";
import { SchoolTab } from "@/components/company/clientes/escola/SchoolTab";
import { RegistrationsReviewBoard } from "@/components/registrations/RegistrationsReviewBoard";
import { SyncAllProgressModal } from "@/components/registrations/SyncAllProgressModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
    ClientRegistrationListRow,
    ClientRoleRow,
    PaginatedResponse,
    PickupAuthorizationRow,
    InviteRow,
    RegistrationLinkListRow,
    ResponsibleRow,
    MemberRow,
    SchoolClassRow,
    ShiftRow,
    StudentRow,
    VehicleRow,
} from "@/types/domain";
import { emptyPaginated } from "@/lib/pagination";
import type { ClientAddressRow } from "@/types/client-address";

export type ClientDetailTabsProps = {
    clientId: string;
    clientType: string;
    isAdmin?: boolean;
    canEditAddresses?: boolean;
    initialAddresses?: ClientAddressRow[];
    initialLinks: RegistrationLinkListRow[];
    initialRows: ClientRegistrationListRow[];
    /** Só quando `clientType === "school"`: dados carregados no servidor */
    initialSchoolClasses?: SchoolClassRow[];
    initialSchoolStudents?: PaginatedResponse<StudentRow>;
    initialSchoolResponsibles?: PaginatedResponse<ResponsibleRow>;
    initialSchoolMembers?: PaginatedResponse<MemberRow>;
    initialSchoolRoles?: ClientRoleRow[];
    initialSchoolShifts?: ShiftRow[];
    initialSchoolPickupAuthorizations?: PickupAuthorizationRow[];
    initialSchoolInvites?: InviteRow[];
    initialSchoolVehicles?: PaginatedResponse<VehicleRow>;
};

export function ClientDetailTabs({
    clientId,
    clientType,
    isAdmin = false,
    canEditAddresses = false,
    initialAddresses = [],
    initialLinks,
    initialRows,
    initialSchoolClasses = [],
    initialSchoolStudents = emptyPaginated<StudentRow>(),
    initialSchoolResponsibles = emptyPaginated<ResponsibleRow>(),
    initialSchoolMembers = emptyPaginated<MemberRow>(),
    initialSchoolRoles = [],
    initialSchoolShifts = [],
    initialSchoolPickupAuthorizations = [],
    initialSchoolInvites = [],
    initialSchoolVehicles = emptyPaginated<VehicleRow>(),
}: ClientDetailTabsProps) {
    const isSchool = clientType === "school";

    if (isSchool) {
        return (
            <SchoolTab
                clientId={clientId}
                isAdmin={isAdmin}
                canEditAddresses={canEditAddresses}
                initialAddresses={initialAddresses}
                initialClasses={initialSchoolClasses}
                initialStudents={initialSchoolStudents}
                initialResponsibles={initialSchoolResponsibles}
                initialMembers={initialSchoolMembers}
                initialRoles={initialSchoolRoles}
                initialShifts={initialSchoolShifts}
                initialPickupAuthorizations={initialSchoolPickupAuthorizations}
                initialInvites={initialSchoolInvites}
                initialVehicles={initialSchoolVehicles}
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
                    <SyncAllProgressModal
                        variant="company"
                        companyClientId={clientId}
                    />
                </div>
                <RegistrationsReviewBoard
                    variant="company"
                    companyClientId={clientId}
                    initialRows={initialRows}
                />
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
                <p className="text-muted-foreground text-sm">
                    Gere links públicos e copie quando precisar. As solicitações
                    ficam na aba &quot;Solicitações recebidas&quot;.
                </p>
                <CompanyClientRegistrationLinksPanel
                    clientId={clientId}
                    initialLinks={initialLinks}
                />
            </TabsContent>

            <TabsContent value="addresses" className="space-y-4">
                <ClientAddressesPanel
                    clientId={clientId}
                    initialAddresses={initialAddresses}
                    canEdit={canEditAddresses}
                />
            </TabsContent>
        </Tabs>
    );
}
