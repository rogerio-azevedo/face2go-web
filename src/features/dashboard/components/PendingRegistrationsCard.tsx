import { UserCheck } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PendingRegistrationsCard({ count }: { count: number }) {
    const label =
        count === 1
            ? "1 cadastro aguardando aprovação"
            : `${count} cadastros aguardando aprovação`;

    return (
        <section className="flex flex-col gap-4 rounded-xl bg-primary px-4 py-4 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/15">
                    <UserCheck className="size-5" aria-hidden />
                </div>
                <div>
                    <p className="text-base font-semibold">{label}</p>
                    <p className="mt-1 text-sm text-primary-foreground/80">
                        Essas pessoas ainda não passam no leitor.
                    </p>
                </div>
            </div>
            <Link
                href="/client/cadastros"
                className={cn(
                    buttonVariants({ variant: "secondary", size: "lg" }),
                    "h-11 shrink-0 px-4",
                )}
            >
                Revisar agora
            </Link>
        </section>
    );
}
