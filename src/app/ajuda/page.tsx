import { ManualPage } from "@/components/ajuda/ManualPage";
import { buildManualMetadata, getPublicBrand } from "@/lib/public-brands";

export const metadata = buildManualMetadata("face2go");

export default function AjudaPage() {
    return <ManualPage config={getPublicBrand("face2go")} />;
}
