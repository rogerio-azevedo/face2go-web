"use client";

import Select, { type StylesConfig } from "react-select";

import type { SelectOption } from "@/components/ui/searchable-select";

const themeStyles: StylesConfig<SelectOption, true> = {
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
    multiValue: (base) => ({
        ...base,
        backgroundColor: "var(--accent)",
        borderRadius: "calc(var(--radius) - 2px)",
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: "var(--foreground)",
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: "var(--muted-foreground)",
        ":hover": {
            backgroundColor: "var(--destructive)",
            color: "var(--destructive-foreground)",
        },
    }),
    placeholder: (base) => ({
        ...base,
        color: "var(--muted-foreground)",
    }),
    input: (base) => ({
        ...base,
        color: "var(--foreground)",
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

export function SearchableMultiSelect({
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
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    isDisabled?: boolean;
    noOptionsMessage?: string;
}) {
    const selected = options.filter((o) => value.includes(o.value));

    return (
        <Select<SelectOption, true>
            inputId={id}
            instanceId={id}
            options={options}
            value={selected}
            onChange={(opts) => onChange(opts.map((o) => o.value))}
            placeholder={placeholder}
            isDisabled={isDisabled}
            isClearable
            isSearchable
            isMulti
            closeMenuOnSelect={false}
            noOptionsMessage={() => noOptionsMessage}
            styles={themeStyles}
            menuPortalTarget={
                typeof document !== "undefined" ? document.body : undefined
            }
            menuPosition="fixed"
            classNamePrefix="searchable-multi-select"
        />
    );
}
