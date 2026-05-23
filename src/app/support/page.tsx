import type { Metadata } from "next";
import Link from "next/link";

import { Mail, MessageCircle } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

const SUPPORT_EMAIL = "suporte@face2go.com.br";
const SUPPORT_PHONE_DISPLAY = "(65) 99911-2805";
const WHATSAPP_URL = "https://wa.me/5565999112805";

export const metadata: Metadata = {
    title: "Suporte • Face2Go",
    description:
        "Fale com a equipe Face2Go por e-mail ou WhatsApp para dúvidas e ajuda.",
};

export default function SupportPage() {
    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
            <div className="flex w-full max-w-lg flex-col gap-6">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle>Suporte Face2Go</CardTitle>
                        <CardDescription>
                            Entre em contato pelos canais abaixo. Respondemos assim que possível em
                            horário comercial.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <div className="mb-3 flex items-center gap-2 text-foreground font-medium">
                                <Mail className="size-5 shrink-0 text-primary" aria-hidden />
                                <span>E-mail</span>
                            </div>
                            <p className="text-muted-foreground text-sm">{SUPPORT_EMAIL}</p>
                            <a
                                href={`mailto:${SUPPORT_EMAIL}`}
                                className={buttonVariants({ variant: "default", className: "mt-3 w-full" })}
                            >
                                Enviar e-mail
                            </a>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <div className="mb-3 flex items-center gap-2 text-foreground font-medium">
                                <MessageCircle className="size-5 shrink-0 text-primary" aria-hidden />
                                <span>WhatsApp</span>
                            </div>
                            <p className="text-muted-foreground text-sm">{SUPPORT_PHONE_DISPLAY}</p>
                            <a
                                href={WHATSAPP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={buttonVariants({ variant: "default", className: "mt-3 w-full" })}
                            >
                                Abrir WhatsApp
                            </a>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-center border-t pt-6">
                        <Link href="/" className={buttonVariants({ variant: "ghost" })}>
                            Página inicial
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
