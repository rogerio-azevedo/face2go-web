"use client";

import Select, { type StylesConfig } from "react-select";

export type SelectOption = { value: string; label: string };

const themeStyles: StylesConfig<SelectOption, false> = {
    control: (base, state) => ({
        ...base,
        minHeight: "2.5rem",
        borderColor: "var(--border)",
        backgroundColor: "var(--background)",
        borderRadius: "var(--radius)",
        boxShadow: state.isFocused
            ? "0 0 0 3px color-mix(in oklch, var(--ring) 50%, transparent)"
            : base.boxShadow,
        "&:hover": {
            borderColor: "var(--ring)",
        },
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: "var(--popover)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        zIndex: 9999,
    }),
    menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? "var(--primary)"
            : state.isFocused
              ? "var(--accent)"
              : "transparent",
        color: state.isSelected
            ? "var(--primary-foreground)"
            : "var(--foreground)",
        cursor: "pointer",
    }),
    singleValue: (base) => ({
        ...base,
        color: "var(--foreground)",
    }),
    input: (base) => ({
        ...base,
        color: "var(--foreground)",
    }),
    placeholder: (base) => ({
        ...base,
        color: "var(--muted-foreground)",
    }),
    indicatorSeparator: () => ({
        display: "none",
    }),
    dropdownIndicator: (base) => ({
        ...base,
        color: "var(--muted-foreground)",
    }),
    clearIndicator: (base) => ({
        ...base,
        color: "var(--muted-foreground)",
    }),
};

export function SearchableSelect({
    id,
    options,
    value,
    onChange,
    placeholder = "Selecione...",
    isDisabled = false,
    noOptionsMessage = "Nenhum resultado",
}: {
    id?: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isDisabled?: boolean;
    noOptionsMessage?: string;
}) {
    const selected = options.find((o) => o.value === value) ?? null;

    return (
        <Select<SelectOption, false>
            inputId={id}
            instanceId={id}
            options={options}
            value={selected}
            onChange={(opt) => onChange(opt?.value ?? "")}
            placeholder={placeholder}
            isDisabled={isDisabled}
            isClearable
            isSearchable
            noOptionsMessage={() => noOptionsMessage}
            styles={themeStyles}
            menuPortalTarget={
                typeof document !== "undefined" ? document.body : undefined
            }
            menuPosition="fixed"
            classNamePrefix="searchable-select"
        />
    );
}
