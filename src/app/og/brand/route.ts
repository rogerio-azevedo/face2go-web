import { getBrand } from "@/features/branding/server/get-brand";
import { renderBrandOpenGraph } from "@/features/branding/server/render-brand-og";

export const runtime = "nodejs";

export async function GET(request: Request) {
    const brand = await getBrand();
    if (brand.isDefault || brand.source !== "domain") {
        return Response.redirect(new URL("/og/face2go-generic.png", request.url));
    }

    const image = await renderBrandOpenGraph(brand);
    image.headers.set(
        "Cache-Control",
        "public, max-age=86400, stale-while-revalidate=604800",
    );
    return image;
}
