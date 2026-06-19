import Image from "next/image";

import { Car, Clock, Home, UserPlus } from "lucide-react";

import type {
    ManualScreenIcon,
    ManualScreenImage,
    PublicBrandConfig,
} from "@/lib/public-brands/types";

const SCREEN_ICONS = {
    home: Home,
    "user-plus": UserPlus,
    clock: Clock,
    car: Car,
} satisfies Record<ManualScreenIcon, typeof Home>;

type ManualScreensProps = {
    config: PublicBrandConfig;
};

function ScreenGallery({ images }: { images: ManualScreenImage[] }) {
    return (
        <div
            className={
                images.length > 1
                    ? "mb-4 grid gap-4 sm:grid-cols-2"
                    : "mb-4"
            }
        >
            {images.map((image) => (
                <figure
                    key={image.src}
                    className={
                        images.length === 1
                            ? "mx-auto w-full max-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                            : "overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                    }
                >
                    <div className="relative aspect-9/19 w-full">
                        <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            sizes="(max-width: 640px) 50vw, 220px"
                            className="object-cover object-top"
                        />
                    </div>
                    {image.caption ? (
                        <figcaption className="text-brand-slate border-t border-slate-200 px-3 py-2 text-center text-xs">
                            {image.caption}
                        </figcaption>
                    ) : null}
                </figure>
            ))}
        </div>
    );
}

export function ManualScreens({ config }: ManualScreensProps) {
    return (
        <section id="telas-do-app" className="scroll-mt-24">
            <div className="mb-6">
                <h2 className="text-brand-deep-navy text-2xl font-bold tracking-tight">
                    Telas do aplicativo
                </h2>
                <p className="text-brand-slate mt-1 text-sm">
                    Conheça cada menu e suas principais funcionalidades
                </p>
            </div>

            <div className="space-y-6">
                {config.copy.screens.map((screen) => {
                    const Icon = SCREEN_ICONS[screen.icon];

                    return (
                        <article
                            key={screen.id}
                            id={screen.id}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                        >
                            <div className="mb-4 flex items-start gap-4">
                                <div className="bg-brand-deep-navy-soft text-brand-deep-navy flex size-11 shrink-0 items-center justify-center rounded-xl">
                                    <Icon className="size-5" aria-hidden />
                                </div>
                                <div>
                                    <h3 className="text-brand-deep-navy text-xl font-semibold">
                                        {screen.title}
                                    </h3>
                                    <p className="brand-screen-subtitle text-sm font-medium">
                                        {screen.subtitle}
                                    </p>
                                </div>
                            </div>

                            <p className="text-brand-slate mb-4 text-base leading-7">
                                {screen.description}
                            </p>

                            <ScreenGallery images={screen.images} />

                            <ul className="text-brand-slate space-y-2 border-t border-slate-100 pt-4">
                                {screen.tips.map((tip) => (
                                    <li
                                        key={tip}
                                        className="flex gap-2 text-sm leading-6"
                                    >
                                        <span
                                            className="brand-tip-dot mt-1.5 size-1.5 shrink-0 rounded-full"
                                            aria-hidden
                                        />
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
