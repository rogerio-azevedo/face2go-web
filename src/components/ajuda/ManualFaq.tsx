"use client";

import Link from "next/link";

import { ChevronDown, HelpCircle } from "lucide-react";

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type {
    FaqAnswerPart,
    ManualFaqItem,
} from "@/lib/public-brands/types";

type ManualFaqProps = {
    faq: ManualFaqItem[];
    storeLinks: {
        playStore: string;
        appStore: string;
    };
};

function FaqAnswer({
    parts,
    storeLinks,
}: {
    parts: FaqAnswerPart[];
    storeLinks: ManualFaqProps["storeLinks"];
}) {
    return (
        <>
            {parts.map((part, index) => {
                if (part.type === "text") {
                    return <span key={index}>{part.text}</span>;
                }

                if (part.type === "link") {
                    if (part.external) {
                        return (
                            <a
                                key={index}
                                href={part.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-link font-medium hover:underline"
                            >
                                {part.label}
                            </a>
                        );
                    }

                    return (
                        <Link
                            key={index}
                            href={part.href}
                            className="text-brand-link font-medium hover:underline"
                        >
                            {part.label}
                        </Link>
                    );
                }

                const href =
                    part.store === "play"
                        ? storeLinks.playStore
                        : storeLinks.appStore;
                const label = part.store === "play" ? "Google Play" : "App Store";

                return (
                    <a
                        key={index}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-link font-medium hover:underline"
                    >
                        {label}
                    </a>
                );
            })}
        </>
    );
}

function FaqItem({
    item,
    storeLinks,
}: {
    item: ManualFaqItem;
    storeLinks: ManualFaqProps["storeLinks"];
}) {
    return (
        <Collapsible className="group/faq border-b border-slate-200 last:border-b-0">
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 py-4 text-left">
                <span className="text-brand-deep-navy text-base font-medium">
                    {item.question}
                </span>
                <ChevronDown
                    className="text-brand-slate size-5 shrink-0 transition-transform duration-200 group-data-[open]/faq:rotate-180"
                    aria-hidden
                />
            </CollapsibleTrigger>
            <CollapsibleContent className="text-brand-slate overflow-hidden pb-4 text-sm leading-7">
                <FaqAnswer parts={item.answer} storeLinks={storeLinks} />
            </CollapsibleContent>
        </Collapsible>
    );
}

export function ManualFaq({ faq, storeLinks }: ManualFaqProps) {
    return (
        <section id="faq" className="scroll-mt-24">
            <div className="mb-6 flex items-center gap-3">
                <div className="brand-icon-badge flex size-10 items-center justify-center rounded-full">
                    <HelpCircle className="size-5" aria-hidden />
                </div>
                <div>
                    <h2 className="text-brand-deep-navy text-2xl font-bold tracking-tight">
                        Perguntas frequentes
                    </h2>
                    <p className="text-brand-slate text-sm">
                        Respostas rápidas para as dúvidas mais comuns
                    </p>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-5 shadow-sm sm:px-6">
                {faq.map((item) => (
                    <FaqItem
                        key={item.question}
                        item={item}
                        storeLinks={storeLinks}
                    />
                ))}
            </div>
        </section>
    );
}
