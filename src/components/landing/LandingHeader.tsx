import { LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingHeader() {
    return (
        <header className="border-brand-deep-navy/90 bg-brand-deep-navy/95 supports-backdrop-filter:backdrop-blur-md sticky top-0 z-50 border-b px-4 py-3 shadow-sm sm:px-6">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
                <Link href="/" className="shrink-0">
                    <Image
                        src="/face2go_white.svg"
                        alt="Face2Go"
                        width={492}
                        height={185}
                        priority
                        className="h-9 w-auto max-w-[176px]"
                    />
                </Link>
                <Link
                    href="/login"
                    className={cn(
                        buttonVariants({ variant: "default", size: "lg" }),
                        "h-11 gap-2 px-5 text-[15px] font-semibold",
                    )}
                >
                    <LogIn aria-hidden className="size-4" />
                    Acessar o sistema
                </Link>
            </div>
        </header>
    );
}
