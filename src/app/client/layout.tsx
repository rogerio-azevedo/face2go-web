import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppSidebar } from "@/components/shared/Sidebar/app-sidebar";
import { Header } from "@/components/shared/Header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const r = session?.user?.role;
    const allowed =
        r === "client_admin" ||
        r === "client_operator" ||
        r === "face_user";
    if (!session?.user || !allowed) {
        redirect("/login?error=Sem permissão");
    }

    return (
        <SidebarProvider>
            <AppSidebar user={session.user} />
            <SidebarInset>
                <Header />
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/10 px-4 pb-6 pt-3 md:px-6 md:pb-8 md:pt-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
