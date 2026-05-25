"use client";

import { useMemo } from "react";
import type { ComponentProps } from "react";
import {
    BriefcaseBusiness,
    Building2,
    Camera,
    FlaskConical,
    History,
    LayoutDashboard,
    MonitorPlay,
    ScanLine,
    Users,
} from "lucide-react";
import Image from "next/image";
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
                    title: "Câmeras",
                    url: "/company/cameras",
                    icon: Camera,
                },
                {
                    title: "Acessos",
                    url: "/company/acessos",
                    icon: History,
                },
                {
                    title: "Usuários",
                    url: "/company/usuarios",
                    icon: Users,
                },
                {
                    title: "Display na TV",
                    url: "/company/display",
                    icon: MonitorPlay,
                },
                ...(process.env.NODE_ENV !== "production"
                    ? [
                          {
                              title: "Dev Tools",
                              url: "/company/dev",
                              icon: FlaskConical,
                          },
                      ]
                    : []),
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
            if (pathSet?.has("/company/cameras") === true) {
                items.push({
                    title: "Câmeras",
                    url: "/company/cameras",
                    icon: Camera,
                });
            }
            if (pathSet?.has("/company/acessos") === true) {
                items.push({
                    title: "Acessos",
                    url: "/company/acessos",
                    icon: History,
                });
            }
            if (pathSet?.has("/company/usuarios") === true) {
                items.push({
                    title: "Usuários",
                    url: "/company/usuarios",
                    icon: Users,
                });
            }
            if (pathSet?.has("/company/display") === true) {
                items.push({
                    title: "Display na TV",
                    url: "/company/display",
                    icon: MonitorPlay,
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
    productName = "Face2go",
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
                <div className="flex items-center gap-2 py-0">
                    {/* Ícone visível apenas no estado colapsado */}
                    <div className="hidden group-data-[collapsible=icon]:flex">
                        <Image
                            src="/icone.png"
                            alt={productName}
                            width={32}
                            height={32}
                            priority
                            className="h-auto w-8"
                        />
                    </div>
                    {/* Logo completo visível no estado expandido */}
                    <div className="group-data-[collapsible=icon]:hidden">
                        <Image
                            src="/face2go_dark.svg"
                            alt={productName}
                            width={160}
                            height={45}
                            priority
                            className="dark:invert h-auto w-[160px] max-w-full"
                        />
                        {productSubtitle ? (
                            <span className="block truncate text-xs text-muted-foreground">
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
