"use client";

import { CompanyClientRegistrationLinksPanel } from "@/components/company/clientes/CompanyClientRegistrationLinksPanel";
import { SchoolTab } from "@/components/company/clientes/escola/SchoolTab";
import { RegistrationsReviewBoard } from "@/components/registrations/RegistrationsReviewBoard";
import { SyncAllProgressModal } from "@/components/registrations/SyncAllProgressModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
    ClientRegistrationListRow,
    PaginatedResponse,
    PickupAuthorizationRow,
    RegistrationLinkListRow,
    ResponsibleRow,
    SchoolClassRow,
    ShiftRow,
    StudentRow,
    VehicleRow,
} from "@/types/domain";
import { emptyPaginated } from "@/lib/pagination";

export type ClientDetailTabsProps = {
    clientId: string;
    clientType: string;
    isAdmin?: boolean;
    initialLinks: RegistrationLinkListRow[];
    initialRows: ClientRegistrationListRow[];
    /** Só quando `clientType === "school"`: dados carregados no servidor */
    initialSchoolClasses?: SchoolClassRow[];
    initialSchoolStudents?: PaginatedResponse<StudentRow>;
    initialSchoolResponsibles?: PaginatedResponse<ResponsibleRow>;
    initialSchoolShifts?: ShiftRow[];
    initialSchoolPickupAuthorizations?: PickupAuthorizationRow[];
    initialSchoolVehicles?: PaginatedResponse<VehicleRow>;
};

export function ClientDetailTabs({
    clientId,
    clientType,
    isAdmin = false,
    initialLinks,
    initialRows,
    initialSchoolClasses = [],
    initialSchoolStudents = emptyPaginated<StudentRow>(),
    initialSchoolResponsibles = emptyPaginated<ResponsibleRow>(),
    initialSchoolShifts = [],
    initialSchoolPickupAuthorizations = [],
    initialSchoolVehicles = emptyPaginated<VehicleRow>(),
}: ClientDetailTabsProps) {
    const isSchool = clientType === "school";

    if (isSchool) {
        return (
            <SchoolTab
                clientId={clientId}
                isAdmin={isAdmin}
                initialClasses={initialSchoolClasses}
                initialStudents={initialSchoolStudents}
                initialResponsibles={initialSchoolResponsibles}
                initialShifts={initialSchoolShifts}
                initialPickupAuthorizations={initialSchoolPickupAuthorizations}
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
        </Tabs>
    );
}
