"use client";

import { CompanyClientRegistrationLinksPanel } from "@/components/company/clientes/CompanyClientRegistrationLinksPanel";
import { SchoolTab } from "@/components/company/clientes/escola/SchoolTab";
import { RegistrationsReviewBoard } from "@/components/registrations/RegistrationsReviewBoard";
import { SyncAllProgressModal } from "@/components/registrations/SyncAllProgressModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
    ClientRegistrationListRow,
    ParentRow,
    RegistrationLinkListRow,
    SchoolClassRow,
    ShiftRow,
    StudentRow,
} from "@/types/domain";

export type ClientDetailTabsProps = {
    clientId: string;
    clientType: string;
    initialLinks: RegistrationLinkListRow[];
    initialRows: ClientRegistrationListRow[];
    /** Só quando `clientType === "school"`: dados carregados no servidor */
    initialSchoolClasses?: SchoolClassRow[];
    initialSchoolStudents?: StudentRow[];
    initialSchoolParents?: ParentRow[];
    initialSchoolShifts?: ShiftRow[];
};

export function ClientDetailTabs({
    clientId,
    clientType,
    initialLinks,
    initialRows,
    initialSchoolClasses = [],
    initialSchoolStudents = [],
    initialSchoolParents = [],
    initialSchoolShifts = [],
}: ClientDetailTabsProps) {
    const isSchool = clientType === "school";

    return (
        <Tabs defaultValue="links">
            <TabsList className="w-full justify-start md:w-fit">
                <TabsTrigger value="links">Links de cadastro</TabsTrigger>
                <TabsTrigger value="requests">
                    Solicitações recebidas
                </TabsTrigger>
                {isSchool ? (
                    <TabsTrigger value="school">Escola</TabsTrigger>
                ) : null}
            </TabsList>

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

            {isSchool ? (
                <TabsContent value="school" className="space-y-6">
                    <SchoolTab
                        clientId={clientId}
                        initialClasses={initialSchoolClasses}
                        initialStudents={initialSchoolStudents}
                        initialParents={initialSchoolParents}
                        initialShifts={initialSchoolShifts}
                    />
                </TabsContent>
            ) : null}
        </Tabs>
    );
}
