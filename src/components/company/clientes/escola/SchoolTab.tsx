"use client";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import { InvitesSection } from "./InvitesSection";
import { ClientAddressesPanel } from "@/components/company/clientes/enderecos/ClientAddressesPanel";
import { DeviceSyncQueuePanel } from "@/features/device-sync/components/DeviceSyncQueuePanel";
import type { SchoolSection } from "@/features/school/lib/school-section";
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
    initialSection,
    initialSearch,
    initialOpenId,
}: {
    clientId: string;
    isAdmin?: boolean;
    canEditAddresses?: boolean;
    initialSection?: SchoolSection;
    initialSearch?: string;
    initialOpenId?: string;
}) {
    const section = initialSection ?? "students";
    const deepLink = (target: SchoolSection) =>
        target === section ? { initialSearch, initialOpenId } : {};

    return (
        <div className="space-y-4">
            <Tabs defaultValue={section}>
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
                    {isAdmin ? (
                        <TabsTrigger value="sync-queue">Fila de sync</TabsTrigger>
                    ) : null}
                </TabsList>
                <TabsContent value="students" className="pt-4">
                    <StudentsSection
                        clientId={clientId}
                        isAdmin={isAdmin}
                        {...deepLink("students")}
                    />
                </TabsContent>
                <TabsContent value="parents" className="pt-4">
                    <ParentsSection
                        clientId={clientId}
                        isAdmin={isAdmin}
                        {...deepLink("parents")}
                    />
                </TabsContent>
                <TabsContent value="members" className="pt-4">
                    <MembersSection
                        clientId={clientId}
                        isAdmin={isAdmin}
                        {...deepLink("members")}
                    />
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
                {isAdmin ? (
                    <TabsContent value="sync-queue" className="pt-4">
                        <DeviceSyncQueuePanel clientId={clientId} />
                    </TabsContent>
                ) : null}
            </Tabs>
        </div>
    );
}
