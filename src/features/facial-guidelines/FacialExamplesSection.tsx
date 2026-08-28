import { CheckCircle2, XCircle } from "lucide-react";
import Image from "next/image";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FacialExample } from "@/lib/public-brands/types";

type FacialExamplesSectionProps = {
    heading: string;
    kind: FacialExample["kind"];
    examples: FacialExample[];
};

export function FacialExamplesSection({
    heading,
    kind,
    examples,
}: FacialExamplesSectionProps) {
    const isIdeal = kind === "ideal";
    const sectionId = isIdeal ? "exemplos-ideais" : "exemplos-inadequados";

    return (
        <section id={sectionId} className="scroll-mt-24">
            <div className="mb-6 flex items-center gap-2">
                {isIdeal ? (
                    <CheckCircle2
                        className="size-6 text-emerald-600"
                        aria-hidden
                    />
                ) : (
                    <XCircle className="size-6 text-red-600" aria-hidden />
                )}
                <h2 className="text-brand-deep-navy text-2xl font-bold tracking-tight">
                    {heading}
                </h2>
            </div>

            <div
                className={cn(
                    "grid gap-4",
                    isIdeal
                        ? "sm:grid-cols-3"
                        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
                )}
            >
                {examples.map((example) => (
                    <ExampleCard key={example.id} example={example} />
                ))}
            </div>
        </section>
    );
}

function ExampleCard({ example }: { example: FacialExample }) {
    const isIdeal = example.kind === "ideal";

    return (
        <Card
            size="sm"
            className={cn(
                "bg-white py-0 shadow-sm",
                isIdeal ? "ring-emerald-200" : "ring-red-200",
            )}
        >
            <div className="relative aspect-3/4 w-full overflow-hidden bg-slate-100">
                <Image
                    src={example.src}
                    alt={example.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
                    className="object-cover object-top"
                />
                <span
                    className={cn(
                        "absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-white/90 shadow-sm",
                        isIdeal ? "text-emerald-600" : "text-red-600",
                    )}
                    aria-hidden
                >
                    {isIdeal ? (
                        <CheckCircle2 className="size-5" />
                    ) : (
                        <XCircle className="size-5" />
                    )}
                </span>
            </div>
            <CardHeader className="px-3 pt-3 pb-0">
                <CardTitle className="text-brand-deep-navy">
                    {example.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
                <CardDescription className="text-brand-slate leading-5">
                    {example.description}
                </CardDescription>
            </CardContent>
        </Card>
    );
}
