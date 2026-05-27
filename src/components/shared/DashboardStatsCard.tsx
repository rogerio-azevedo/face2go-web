import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DashboardStatsCardProps = {
    title: string;
    value: number;
    description: string;
    icon: LucideIcon;
    iconClassName?: string;
    href?: string;
};

function formatStatValue(value: number): string {
    return new Intl.NumberFormat("pt-BR").format(value);
}

function CardInner({
    title,
    value,
    description,
    icon: Icon,
    iconClassName,
}: DashboardStatsCardProps) {
    return (
        <Card className="h-full transition-colors hover:bg-muted/30">
            <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div
                        className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg text-white",
                            iconClassName,
                        )}
                    >
                        <Icon className="size-5" aria-hidden />
                    </div>
                    <CardTitle className="truncate text-base font-semibold">
                        {title}
                    </CardTitle>
                </div>
                <span className="shrink-0 text-2xl font-bold tabular-nums tracking-tight">
                    {formatStatValue(value)}
                </span>
            </CardHeader>
            <CardContent>
                <CardDescription>{description}</CardDescription>
            </CardContent>
        </Card>
    );
}

export function DashboardStatsCard(props: DashboardStatsCardProps) {
    if (props.href) {
        return (
            <Link
                href={props.href}
                className="block rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
                <CardInner {...props} />
            </Link>
        );
    }

    return <CardInner {...props} />;
}
