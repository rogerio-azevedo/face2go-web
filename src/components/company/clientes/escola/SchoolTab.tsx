"use client";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import { InvitesSection } from "./InvitesSection";
import { ClientAddressesPanel } from "@/components/company/clientes/enderecos/ClientAddressesPanel";
import { MembersSection } from "./MembersSection";
import { ParentsSection } from "./ParentsSection";
import { PickupAuthorizationsSection } from "./PickupAuthorizationsSection";
import { SchoolClassesSection } from "./SchoolClassesSection";
import { ShiftsSection } from "./ShiftsSection";
import { StudentsSection } from "./StudentsSection";
import { VehiclesSection } from "./VehiclesSection";

export function SchoolTab({
    clientId,
    isAdmin = false,
    canEditAddresses = false,
}: {
    clientId: string;
    isAdmin?: boolean;
    canEditAddresses?: boolean;
}) {
    return (
        <div className="space-y-4">
            <Tabs defaultValue="students">
                <TabsList className="h-auto w-full flex-wrap justify-start gap-1 md:w-fit">
                    <TabsTrigger value="students">Alunos</TabsTrigger>
                    <TabsTrigger value="parents">Responsáveis</TabsTrigger>
                    <TabsTrigger value="members">Membros</TabsTrigger>
                    <TabsTrigger value="shifts">Horários</TabsTrigger>
                    <TabsTrigger value="classes">Turmas</TabsTrigger>
                    <TabsTrigger value="pickups">
                        Autorizações de retiradas
                    </TabsTrigger>
                    <TabsTrigger value="invites">Visitantes</TabsTrigger>
                    <TabsTrigger value="vehicles">Veículos</TabsTrigger>
                    <TabsTrigger value="addresses">Endereços</TabsTrigger>
                </TabsList>
                <TabsContent value="students" className="pt-4">
                    <StudentsSection clientId={clientId} isAdmin={isAdmin} />
                </TabsContent>
                <TabsContent value="parents" className="pt-4">
                    <ParentsSection clientId={clientId} isAdmin={isAdmin} />
                </TabsContent>
                <TabsContent value="members" className="pt-4">
                    <MembersSection clientId={clientId} isAdmin={isAdmin} />
                </TabsContent>
                <TabsContent value="shifts" className="pt-4">
                    <ShiftsSection clientId={clientId} />
                </TabsContent>
                <TabsContent value="classes" className="pt-4">
                    <SchoolClassesSection clientId={clientId} />
                </TabsContent>
                <TabsContent value="pickups" className="pt-4">
                    <PickupAuthorizationsSection clientId={clientId} />
                </TabsContent>
                <TabsContent value="invites" className="pt-4">
                    <InvitesSection clientId={clientId} />
                </TabsContent>
                <TabsContent value="vehicles" className="pt-4">
                    <VehiclesSection clientId={clientId} />
                </TabsContent>
                <TabsContent value="addresses" className="pt-4">
                    <ClientAddressesPanel
                        clientId={clientId}
                        canEdit={canEditAddresses}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
