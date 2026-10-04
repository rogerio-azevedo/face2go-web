export type CatalogUnit = {
    id: string;
    name: string;
    isActive: boolean;
};

export type CatalogBlock = {
    id: string;
    name: string;
    isActive: boolean;
    units: CatalogUnit[];
};
