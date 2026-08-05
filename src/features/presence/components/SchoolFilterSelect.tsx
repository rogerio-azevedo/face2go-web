"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import type { ClientListRow } from "@/types/domain";

type SchoolFilterSelectProps = {
    clients: ClientListRow[];
    value: string;
};

export function SchoolFilterSelect({ clients, value }: SchoolFilterSelectProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [pending, startTransition] = useTransition();

    const schools = clients.filter(
        (client) => client.type === "school" && client.isActive,
    );

    const onChange = (next: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (next === "all") {
            params.delete("clientId");
        } else {
            params.set("clientId", next);
        }
        startTransition(() => {
            router.push(`/company/presenca?${params.toString()}`);
        });
    };

    return (
        <select
            className="h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 text-sm"
            value={value}
            disabled={pending}
            onChange={(event) => onChange(event.target.value)}
        >
            <option value="all">Todas as escolas</option>
            {schools.map((school) => (
                <option key={school.id} value={school.id}>
                    {school.name}
                </option>
            ))}
        </select>
    );
}
