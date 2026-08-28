import { FacialGuidelinesPage } from "@/features/facial-guidelines";
import {
    buildFacialGuidelinesMetadata,
    getPublicBrand,
} from "@/lib/public-brands";

export const metadata = buildFacialGuidelinesMetadata("face2go");

export default function OrientacoesFacialPage() {
    return <FacialGuidelinesPage config={getPublicBrand("face2go")} />;
}
