import { MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toBrazilContactNumber } from "@/features/registrations/lib/registration-format";
import { cn } from "@/lib/utils";

type RegistrationSupportActionsProps = {
    clientName: string;
    supportPhone?: string | null;
    supportWhatsapp?: string | null;
    className?: string;
};

export function RegistrationSupportActions({
    clientName,
    supportPhone,
    supportWhatsapp,
    className,
}: RegistrationSupportActionsProps) {
    const phone = toBrazilContactNumber(supportPhone ?? null);
    const whatsapp = toBrazilContactNumber(supportWhatsapp ?? null);

    if (!phone && !whatsapp) return null;

    const whatsappMessage = encodeURIComponent(
        `Olá! Preciso de ajuda com meu cadastro na ${clientName}.`,
    );

    return (
        <div
            className={cn(
                "grid gap-2",
                phone && whatsapp ? "grid-cols-2" : "grid-cols-1",
                className,
            )}
        >
            {phone ? (
                <Button
                    size="lg"
                    variant="outline"
                    nativeButton={false}
                    className="h-11 w-full"
                    render={
                        <a
                            href={`tel:+${phone}`}
                            aria-label="Ligar para o suporte"
                        />
                    }
                >
                    <Phone aria-hidden />
                    Ligar
                </Button>
            ) : null}

            {whatsapp ? (
                <Button
                    size="lg"
                    nativeButton={false}
                    className="h-11 w-full"
                    render={
                        <a
                            href={`https://wa.me/${whatsapp}?text=${whatsappMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Abrir conversa com o suporte no WhatsApp"
                        />
                    }
                >
                    <MessageCircle aria-hidden />
                    Mensagem
                </Button>
            ) : null}
        </div>
    );
}
