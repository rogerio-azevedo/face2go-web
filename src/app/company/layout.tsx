import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/shared/Sidebar/app-sidebar";
import { Header } from "@/components/shared/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSidebarNavAccess } from "@/lib/permissions";

export default async function CompanyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (
        !session?.user ||
        (session.user.role !== "company_admin" &&
            session.user.role !== "company_operator")
    ) {
        redirect("/login?error=Sem permissão");
    }

    const { mainPaths } = await getSidebarNavAccess();

    return (
        <SidebarProvider>
            <AppSidebar user={session.user} mainPaths={mainPaths} />
            <SidebarInset>
                <Header />
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/10 px-4 pb-6 pt-3 md:px-6 md:pb-8 md:pt-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
