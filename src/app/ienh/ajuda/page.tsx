import { ManualPage } from "@/components/ajuda/ManualPage";
import { buildManualMetadata, getPublicBrand } from "@/lib/public-brands";

export const metadata = buildManualMetadata("ienh");

export default function IenhAjudaPage() {
    return <ManualPage config={getPublicBrand("ienh")} />;
}
