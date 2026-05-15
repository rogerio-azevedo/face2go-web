"use client";

import type {
    PickupAuthorizationRow,
    ResponsibleRow,
    SchoolClassRow,
    ShiftRow,
    StudentRow,
} from "@/types/domain";
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

export function SchoolTab({
    clientId,
    initialClasses,
    initialStudents,
    initialResponsibles,
    initialShifts,
    initialPickupAuthorizations = [],
}: {
    clientId: string;
    initialClasses: SchoolClassRow[];
    initialStudents: StudentRow[];
    initialResponsibles: ResponsibleRow[];
    initialShifts: ShiftRow[];
    initialPickupAuthorizations?: PickupAuthorizationRow[];
}) {
    return (
        <div className="space-y-4">
            <p className="text-muted-foreground max-w-xl text-sm">
                Cadastre turmas, turnos de acesso, alunos e responsáveis. Os
                responsáveis podem ter login no app para acompanhar seus filhos
                conforme suas permissões.
            </p>
            <Tabs defaultValue="classes">
                <TabsList className="h-auto w-full flex-wrap justify-start gap-1 md:w-fit">
                    <TabsTrigger value="classes">Turmas</TabsTrigger>
                    <TabsTrigger value="shifts">Turnos</TabsTrigger>
                    <TabsTrigger value="students">Alunos</TabsTrigger>
                    <TabsTrigger value="parents">Responsáveis</TabsTrigger>
                    <TabsTrigger value="pickups">
                        Autorizações retirada
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="classes" className="pt-4">
                    <SchoolClassesSection
                        clientId={clientId}
                        initialClasses={initialClasses}
                        shifts={initialShifts}
                    />
                </TabsContent>
                <TabsContent value="shifts" className="pt-4">
                    <ShiftsSection
                        clientId={clientId}
                        initialShifts={initialShifts}
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
                        students={initialStudents}
                    />
                </TabsContent>
                <TabsContent value="pickups" className="pt-4">
                    <PickupAuthorizationsSection
                        clientId={clientId}
                        initialAuthorizations={initialPickupAuthorizations}
                        students={initialStudents}
                        responsibles={initialResponsibles}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
