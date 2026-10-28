"use client";

import { createContext, useContext } from "react";

import { defaultBrand, type ResolvedBrand } from "../types";

const BrandContext = createContext<ResolvedBrand>(defaultBrand);

export function BrandProvider({
    brand,
    children,
}: {
    brand: ResolvedBrand;
    children: React.ReactNode;
}) {
    return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): ResolvedBrand {
    return useContext(BrandContext);
}
