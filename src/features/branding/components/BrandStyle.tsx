import { brandCss } from "../brand-css";
import { getBrand } from "../server/get-brand";

export async function BrandStyle() {
    const brand = await getBrand();
    const css = brandCss(brand);
    if (!css) return null;
    return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
