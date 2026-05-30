"use client";

import type {
    PaginatedResponse,
    PickupAuthorizationRow,
    ResponsibleRow,
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

import { ParentsSection } from "./ParentsSection";
import { PickupAuthorizationsSection } from "./PickupAuthorizationsSection";
import { SchoolClassesSection } from "./SchoolClassesSection";
import { ShiftsSection } from "./ShiftsSection";
import { StudentsSection } from "./StudentsSection";
import { VehiclesSection } from "./VehiclesSection";

export function SchoolTab({
    clientId,
    initialClasses,
    initialStudents,
    initialResponsibles,
    initialShifts,
    initialPickupAuthorizations = [],
    initialVehicles = emptyPaginated<VehicleRow>(),
}: {
    clientId: string;
    initialClasses: SchoolClassRow[];
    initialStudents: PaginatedResponse<StudentRow>;
    initialResponsibles: PaginatedResponse<ResponsibleRow>;
    initialShifts: ShiftRow[];
    initialPickupAuthorizations?: PickupAuthorizationRow[];
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
                    <TabsTrigger value="pickups">
                        Autorizações retirada
                    </TabsTrigger>
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
                        classes={initialClasses}
                        initialStudents={initialStudents}
                    />
                </TabsContent>
                <TabsContent value="parents" className="pt-4">
                    <ParentsSection
                        clientId={clientId}
                        initialResponsibles={initialResponsibles}
                    />
                </TabsContent>
                <TabsContent value="pickups" className="pt-4">
                    <PickupAuthorizationsSection
                        clientId={clientId}
                        initialAuthorizations={initialPickupAuthorizations}
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
