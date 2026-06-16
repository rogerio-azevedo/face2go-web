import Image from "next/image";
import Link from "next/link";

export function LandingFooter() {
    const year = new Date().getFullYear();
    return (
        <footer className="border-t border-brand-deep-navy bg-brand-deep-navy px-4 py-10 sm:px-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row sm:gap-8">
                <Link href="/" className="shrink-0">
                    <Image
                        src="/face2go_white.svg"
                        alt="Face2Go"
                        width={492}
                        height={185}
                        className="h-8 w-auto max-w-[160px] opacity-90"
                    />
                </Link>
                <p className="text-brand-slate max-w-md text-center text-sm leading-snug text-white/65 sm:text-right">
                    Gestão de cadastro e acesso com leitores faciais e outros
                    equipamentos. © {year} Face2Go. Todos os direitos reservados.
                </p>
                <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
                    <Link
                        href="/ajuda"
                        className="text-white/75 underline-offset-4 hover:text-white hover:underline"
                    >
                        Ajuda
                    </Link>
                    <Link
                        href="/support"
                        className="text-white/75 underline-offset-4 hover:text-white hover:underline"
                    >
                        Suporte
                    </Link>
                    <Link
                        href="/privacy-policy"
                        className="text-white/75 underline-offset-4 hover:text-white hover:underline"
                    >
                        Política de Privacidade
                    </Link>
                    <Link
                        href="/terms-of-use"
                        className="text-white/75 underline-offset-4 hover:text-white hover:underline"
                    >
                        Termos de Uso
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
