import { Loader2 } from "lucide-react";

export default function CompanyClientUsuariosLoading() {
    return (
        <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2
                className="text-muted-foreground size-8 animate-spin"
                aria-label="Carregando"
            />
        </div>
    );
}
