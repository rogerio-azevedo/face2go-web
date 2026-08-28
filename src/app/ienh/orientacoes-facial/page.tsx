import { FacialGuidelinesPage } from "@/features/facial-guidelines";
import {
    buildFacialGuidelinesMetadata,
    getPublicBrand,
} from "@/lib/public-brands";

export const metadata = buildFacialGuidelinesMetadata("ienh");

export default function IenhOrientacoesFacialPage() {
    return <FacialGuidelinesPage config={getPublicBrand("ienh")} />;
}
