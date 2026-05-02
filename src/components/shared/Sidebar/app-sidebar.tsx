"use client";

import { useMemo } from "react";
import type { ComponentProps } from "react";
import {
    BriefcaseBusiness,
    Building2,
    LayoutDashboard,
    ScanFace,
    ScanLine,
    Users,
} from "lucide-react";
import type { Session } from "next-auth";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";

import { NavMain, type NavMainItem } from "./nav-main";
import { NavUser, type NavSidebarUser } from "./nav-user";

export type { NavMainItem };

function navItemsForRole(
    role: NonNullable<Session["user"]["role"]>,
    mainPaths?: string[] | null,
): NavMainItem[] {
    const pathSet =
        mainPaths && mainPaths.length > 0 ? new Set(mainPaths) : null;

    switch (role) {
        case "super_admin":
            return [
                {
                    title: "Painel",
                    url: "/super-admin/dashboard",
                    icon: LayoutDashboard,
                },
                {
                    title: "Empresas",
                    url: "/super-admin/companies",
                    icon: Building2,
                },
            ];
        case "company_admin":
            return [
                {
                    title: "Painel",
                    url: "/company/dashboard",
                    icon: LayoutDashboard,
                },
                {
                    title: "Clientes",
                    url: "/company/clientes",
                    icon: BriefcaseBusiness,
                },
                {
                    title: "Leitores",
                    url: "/company/leitores",
                    icon: ScanLine,
                },
                {
                    title: "Usuários",
                    url: "/company/usuarios",
                    icon: Users,
                },
            ];
        case "company_operator": {
            const items: NavMainItem[] = [
                {
                    title: "Painel",
                    url: "/company/dashboard",
                    icon: LayoutDashboard,
                },
            ];
            if (pathSet?.has("/company/clientes") === true) {
                items.push({
                    title: "Clientes",
                    url: "/company/clientes",
                    icon: BriefcaseBusiness,
                });
            }
            if (pathSet?.has("/company/leitores") === true) {
                items.push({
                    title: "Leitores",
                    url: "/company/leitores",
                    icon: ScanLine,
                });
            }
            if (pathSet?.has("/company/usuarios") === true) {
                items.push({
                    title: "Usuários",
                    url: "/company/usuarios",
                    icon: Users,
                });
            }
            return items;
        }
        case "client_admin":
        case "client_operator":
            return [
                {
                    title: "Painel",
                    url: "/client/dashboard",
                    icon: LayoutDashboard,
                },
                {
                    title: "Usuários",
                    url: "/client/usuarios",
                    icon: Users,
                },
            ];
        case "face_user":
            return [
                {
                    title: "Painel",
                    url: "/client/dashboard",
                    icon: LayoutDashboard,
                },
            ];
        default:
            return [];
    }
}

function subtitleForRole(
    role: NonNullable<Session["user"]["role"]>,
): string | undefined {
    switch (role) {
        case "super_admin":
            return "Super administrador";
        case "company_admin":
        case "company_operator":
            return "Empresa";
        case "client_admin":
        case "client_operator":
        case "face_user":
            return "Cliente";
        default:
            return undefined;
    }
}

export function AppSidebar({
    user,
    productName = "Faciem",
    mainPaths,
    ...props
}: ComponentProps<typeof Sidebar> & {
    user: NonNullable<Session["user"]>;
    productName?: string;
    /** Rotas permitidas (ex.: operadores com permissões por feature). */
    mainPaths?: string[] | null;
}) {
    const navItems = useMemo(
        () => navItemsForRole(user.role, mainPaths),
        [user.role, mainPaths],
    );
    const productSubtitle = useMemo(
        () => subtitleForRole(user.role),
        [user.role],
    );

    const navUser: NavSidebarUser = {
        name: user?.name ?? null,
        email: user?.email ?? null,
        image: user?.image ?? null,
    };

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center">
                <div className="flex items-center gap-2 py-4">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-data-[collapsible=icon]:size-8">
                        <ScanFace className="size-4 shrink-0" />
                    </div>
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">{productName}</span>
                        {productSubtitle ? (
                            <span className="truncate text-xs text-muted-foreground">
                                {productSubtitle}
                            </span>
                        ) : null}
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={navUser} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
