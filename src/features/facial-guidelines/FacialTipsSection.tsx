import {
    Aperture,
    Ban,
    Eye,
    ImageIcon,
    Ruler,
    ScanFace,
    Scissors,
    Smile,
    Sun,
    User,
} from "lucide-react";

import type {
    FacialPractice,
    FacialPracticeIcon,
    FacialTip,
} from "@/lib/public-brands/types";

const PRACTICE_ICONS = {
    sun: Sun,
    user: User,
    eye: Eye,
    "scan-face": ScanFace,
    ban: Ban,
    smile: Smile,
    scissors: Scissors,
    aperture: Aperture,
} satisfies Record<FacialPracticeIcon, typeof Sun>;

const TIP_ICONS = [Ruler, ImageIcon, Ban] as const;

type FacialTipsSectionProps = {
    practicesHeading: string;
    tipsHeading: string;
    practices: FacialPractice[];
    tips: FacialTip[];
};

export function FacialTipsSection({
    practicesHeading,
    tipsHeading,
    practices,
    tips,
}: FacialTipsSectionProps) {
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <section id="boas-praticas" className="scroll-mt-24">
                <h2 className="text-brand-deep-navy mb-4 text-2xl font-bold tracking-tight">
                    {practicesHeading}
                </h2>
                <ul className="space-y-3">
                    {practices.map((practice) => {
                        const Icon = PRACTICE_ICONS[practice.icon];

                        return (
                            <li
                                key={practice.title}
                                className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                                <span className="bg-brand-deep-navy-soft text-brand-deep-navy flex size-10 shrink-0 items-center justify-center rounded-lg">
                                    <Icon className="size-5" aria-hidden />
                                </span>
                                <div>
                                    <p className="text-brand-deep-navy text-sm font-semibold">
                                        {practice.title}
                                    </p>
                                    <p className="text-brand-slate mt-0.5 text-sm leading-6">
                                        {practice.description}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>

            <section id="dicas-importantes" className="scroll-mt-24">
                <h2 className="text-brand-deep-navy mb-4 text-2xl font-bold tracking-tight">
                    {tipsHeading}
                </h2>
                <ul className="space-y-3">
                    {tips.map((tip, index) => {
                        const Icon = TIP_ICONS[index] ?? Ruler;

                        return (
                            <li
                                key={tip.title}
                                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="bg-brand-accent-soft text-brand-deep-navy flex size-10 shrink-0 items-center justify-center rounded-lg">
                                        <Icon className="size-5" aria-hidden />
                                    </span>
                                    <div>
                                        <p className="text-brand-deep-navy text-base font-semibold">
                                            {tip.title}
                                        </p>
                                        <p className="text-brand-slate mt-1 text-sm leading-6">
                                            {tip.description}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </section>
        </div>
    );
}
