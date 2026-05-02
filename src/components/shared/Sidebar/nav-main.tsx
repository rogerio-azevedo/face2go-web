"use client";

import Link from "next/link";
import { ChevronRightIcon, type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export type NavMainItem = {
    title: string;
    url: string;
    icon?: LucideIcon;
    items?: { title: string; url: string }[];
};

export function NavMain({ items, label }: { items: NavMainItem[]; label?: string }) {
    const pathname = usePathname();

    return (
        <SidebarGroup>
            {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
            <SidebarMenu>
                {items.map((item) => {
                    const isNestedActive =
                        item.items?.some((sub) => pathname === sub.url) ?? false;
                    const isItemActive =
                        pathname === item.url || isNestedActive;

                    return (
                        <SidebarMenuItem key={item.title}>
                            {item.items && item.items.length > 0 ? (
                                <Collapsible
                                    defaultOpen={isItemActive}
                                    className="group/collapsible w-full"
                                >
                                    <CollapsibleTrigger
                                        nativeButton={false}
                                        render={
                                            <SidebarMenuButton
                                                tooltip={item.title}
                                                isActive={isItemActive}
                                            >
                                                {item.icon ? <item.icon /> : null}
                                                <span>{item.title}</span>
                                                <ChevronRightIcon className="ml-auto size-4 transition-transform duration-200 group-data-[open]/collapsible:rotate-90" />
                                            </SidebarMenuButton>
                                        }
                                    />
                                    <CollapsibleContent className="overflow-hidden">
                                        <SidebarMenuSub>
                                            {item.items.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton
                                                        render={<Link href={subItem.url} />}
                                                        isActive={pathname === subItem.url}
                                                    >
                                                        <span>{subItem.title}</span>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </Collapsible>
                            ) : (
                                <SidebarMenuButton
                                    tooltip={item.title}
                                    isActive={pathname === item.url}
                                    render={<Link href={item.url} />}
                                >
                                    {item.icon ? <item.icon /> : null}
                                    <span>{item.title}</span>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
