"use client";

import type {
    ClientRoleRow,
    PaginatedResponse,
    PickupAuthorizationRow,
    InviteRow,
    ResponsibleRow,
    MemberRow,
    SchoolClassRow,
    ShiftRow,
    StudentRow,
    VehicleRow,
} from "@/types/domain";
import { emptyPaginated } from "@/lib/pagination";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import { InvitesSection } from "./InvitesSection";
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
    initialClasses,
    initialStudents,
    initialResponsibles,
    initialMembers,
    initialRoles,
    initialShifts,
    initialPickupAuthorizations = [],
    initialInvites = [],
    initialVehicles = emptyPaginated<VehicleRow>(),
}: {
    clientId: string;
    isAdmin?: boolean;
    initialClasses: SchoolClassRow[];
    initialStudents: PaginatedResponse<StudentRow>;
    initialResponsibles: PaginatedResponse<ResponsibleRow>;
    initialMembers: PaginatedResponse<MemberRow>;
    initialRoles: ClientRoleRow[];
    initialShifts: ShiftRow[];
    initialPickupAuthorizations?: PickupAuthorizationRow[];
    initialInvites?: InviteRow[];
    initialVehicles?: PaginatedResponse<VehicleRow>;
}) {
    return (
        <div className="space-y-4">
            <Tabs defaultValue="shifts">
                <TabsList className="h-auto w-full flex-wrap justify-start gap-1 md:w-fit">
                    <TabsTrigger value="shifts">Horários</TabsTrigger>
                    <TabsTrigger value="classes">Turmas</TabsTrigger>
                    <TabsTrigger value="students">Alunos</TabsTrigger>
                    <TabsTrigger value="parents">Responsáveis</TabsTrigger>
                    <TabsTrigger value="members">Membros</TabsTrigger>
                    <TabsTrigger value="pickups">
                        Autorizações retirada
                    </TabsTrigger>
                    <TabsTrigger value="invites">Visitantes</TabsTrigger>
                    <TabsTrigger value="vehicles">Veículos</TabsTrigger>
                </TabsList>
                <TabsContent value="shifts" className="pt-4">
                    <ShiftsSection
                        clientId={clientId}
                        initialShifts={initialShifts}
                    />
                </TabsContent>
                <TabsContent value="classes" className="pt-4">
                    <SchoolClassesSection
                        clientId={clientId}
                        initialClasses={initialClasses}
                        shifts={initialShifts}
                    />
                </TabsContent>
                <TabsContent value="students" className="pt-4">
                    <StudentsSection
                        clientId={clientId}
                        isAdmin={isAdmin}
                        classes={initialClasses}
                        initialStudents={initialStudents}
                    />
                </TabsContent>
                <TabsContent value="parents" className="pt-4">
                    <ParentsSection
                        clientId={clientId}
                        isAdmin={isAdmin}
                        initialResponsibles={initialResponsibles}
                    />
                </TabsContent>
                <TabsContent value="members" className="pt-4">
                    <MembersSection
                        clientId={clientId}
                        isAdmin={isAdmin}
                        roles={initialRoles}
                        initialMembers={initialMembers}
                    />
                </TabsContent>
                <TabsContent value="pickups" className="pt-4">
                    <PickupAuthorizationsSection
                        clientId={clientId}
                        initialAuthorizations={initialPickupAuthorizations}
                    />
                </TabsContent>
                <TabsContent value="invites" className="pt-4">
                    <InvitesSection
                        clientId={clientId}
                        initialInvites={initialInvites}
                    />
                </TabsContent>
                <TabsContent value="vehicles" className="pt-4">
                    <VehiclesSection
                        clientId={clientId}
                        initialVehicles={initialVehicles}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
