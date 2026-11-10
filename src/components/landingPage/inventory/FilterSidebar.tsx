"use client";

import {
  BADGE_OPTIONS,
  BODY_TYPE_OPTIONS,
  BRAND_OPTIONS,
  CONDITION_OPTIONS,
  DRIVE_TYPE_OPTIONS,
  FUEL_OPTIONS,
  TRANSMISSION_OPTIONS,
} from "@/components/dashboard/listings/vehicleFormOptions";
import { Select } from "@/components/ui/Select";
import { ChevronDown } from "lucide-react";
import React from "react";
import type { InventoryFilters } from "./Carlistingpage";

export type InventoryFiltersPanelProps = {
  filters: InventoryFilters;
  maxPrice: number;
  onFiltersChange: (filters: InventoryFilters) => void;
  /** Outer scroll on desktop; omit max-height in drawer */
  variant?: "sidebar" | "drawer";
};

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label }) => (
  <label className="group flex cursor-pointer items-start justify-between gap-2 py-1">
    <div className="flex min-w-0 flex-1 items-start gap-2.5">
      <div
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-sm border-[1.5px] transition-all duration-150 sm:h-4 sm:w-4 ${
          checked
            ? "border-primary bg-primary"
            : "border-gray-mid group-hover:border-primary"
        }`}
      >
        {checked ? (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path
              d="M1 3.5L3.5 6L8 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </div>
      <span
        className={`min-w-0 flex-1 text-[13px] leading-snug transition-colors break-words ${
          checked ? "font-medium text-font" : "text-gray-mid"
        }`}
      >
        {label}
      </span>
    </div>
  </label>
);

export function countActiveFilterGroups(
  filters: InventoryFilters,
  maxPrice: number,
): number {
  let n = 0;
  if (filters.brands.length > 0) n++;
  if (filters.fuels.length > 0) n++;
  if (filters.bodyTypes.length > 0) n++;
  if (filters.conditions.length > 0) n++;
  if (filters.transmissions.length > 0) n++;
  if (filters.driveTypes.length > 0) n++;
  if (filters.badges.length > 0) n++;
  if (filters.negotiable !== "all") n++;
  if (filters.maxPrice < maxPrice) n++;
  return n;
}

export function InventoryFiltersPanel({
  filters,
  maxPrice,
  onFiltersChange,
  variant = "sidebar",
}: InventoryFiltersPanelProps) {
  const defaultFilters: InventoryFilters = React.useMemo(
    () => ({
      brands: [],
      fuels: [],
      bodyTypes: [],
      conditions: [],
      transmissions: [],
      driveTypes: [],
      badges: [],
      negotiable: "all",
      maxPrice,
    }),
    [maxPrice],
  );

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() =>
    variant === "drawer"
      ? {
          brand: false,
          fuel: false,
          bodyType: false,
          condition: false,
          transmission: false,
          driveType: false,
          badge: false,
          negotiable: false,
          price: true,
        }
      : {
          brand: true,
          fuel: true,
          bodyType: true,
          condition: false,
          transmission: false,
          driveType: false,
          badge: false,
          negotiable: true,
          price: true,
        },
  );

  const toggleSection = (key: keyof typeof expanded) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFilter = (
    key:
      | "brands"
      | "fuels"
      | "bodyTypes"
      | "conditions"
      | "transmissions"
      | "driveTypes"
      | "badges",
    value: string,
  ) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: next });
  };

  const clearFilterGroup = (
    key:
      | "brands"
      | "fuels"
      | "bodyTypes"
      | "conditions"
      | "transmissions"
      | "driveTypes"
      | "badges",
  ) => {
    onFiltersChange({ ...filters, [key]: [] });
  };

  const hasActiveFilters =
    filters.brands.length > 0 ||
    filters.fuels.length > 0 ||
    filters.bodyTypes.length > 0 ||
    filters.conditions.length > 0 ||
    filters.transmissions.length > 0 ||
    filters.driveTypes.length > 0 ||
    filters.badges.length > 0 ||
    filters.negotiable !== "all" ||
    filters.maxPrice < maxPrice;

  const scrollClasses =
    variant === "drawer"
      ? "overflow-visible"
      : "filter-sidebar-scroll max-h-[min(70vh,520px)] overflow-y-auto sm:max-h-[calc(100vh-10rem)] lg:max-h-[calc(100vh-7.5rem)]";

  return (
    <>
      <style>{`
        .filter-sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .filter-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .filter-sidebar-scroll::-webkit-scrollbar-thumb { background: var(--color-line); border-radius: 99px; }
        .filter-sidebar-scroll::-webkit-scrollbar-thumb:hover { background: var(--color-primary-light); }
        .filter-sidebar-scroll { scrollbar-width: thin; scrollbar-color: var(--color-line) transparent; }
      `}</style>
      <div
        className={` border border-line/25 bg-gray-dark p-3 sm:p-4 ${scrollClasses}`}
      >
        <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-font sm:mb-4">
          Filter by
        </h2>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => onFiltersChange(defaultFilters)}
            className="mb-3 touch-manipulation text-xs font-bold uppercase tracking-wider text-primary hover:underline sm:mb-4"
          >
            Clear all filters
          </button>
        ) : null}

        <div className="mb-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleSection("brand")}
              className="flex min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-bold uppercase tracking-wider text-gray-mid touch-manipulation"
            >
              Brand{" "}
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded.brand ? "rotate-180" : ""}`}
              />
            </button>
            {filters.brands.length > 0 ? (
              <button
                type="button"
                onClick={() => clearFilterGroup("brands")}
                className="shrink-0 touch-manipulation text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          {expanded.brand ? (
            <div className="space-y-1">
              {BRAND_OPTIONS.map((brand) => (
                <Checkbox
                  key={brand}
                  checked={filters.brands.includes(brand)}
                  onChange={() => toggleFilter("brands", brand)}
                  label={brand}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleSection("fuel")}
              className="flex min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-bold uppercase tracking-wider text-gray-mid touch-manipulation"
            >
              Fuel Type{" "}
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded.fuel ? "rotate-180" : ""}`}
              />
            </button>
            {filters.fuels.length > 0 ? (
              <button
                type="button"
                onClick={() => clearFilterGroup("fuels")}
                className="shrink-0 touch-manipulation text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          {expanded.fuel ? (
            <div className="space-y-1">
              {FUEL_OPTIONS.map((fuel) => (
                <Checkbox
                  key={fuel}
                  checked={filters.fuels.includes(fuel)}
                  onChange={() => toggleFilter("fuels", fuel)}
                  label={fuel}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleSection("bodyType")}
              className="flex min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-bold uppercase tracking-wider text-gray-mid touch-manipulation"
            >
              Body Type{" "}
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded.bodyType ? "rotate-180" : ""}`}
              />
            </button>
            {filters.bodyTypes.length > 0 ? (
              <button
                type="button"
                onClick={() => clearFilterGroup("bodyTypes")}
                className="shrink-0 touch-manipulation text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          {expanded.bodyType ? (
            <div className="space-y-1">
              {BODY_TYPE_OPTIONS.map((bodyType) => (
                <Checkbox
                  key={bodyType}
                  checked={filters.bodyTypes.includes(bodyType)}
                  onChange={() => toggleFilter("bodyTypes", bodyType)}
                  label={bodyType}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleSection("condition")}
              className="flex min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-bold uppercase tracking-wider text-gray-mid touch-manipulation"
            >
              Condition{" "}
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded.condition ? "rotate-180" : ""}`}
              />
            </button>
            {filters.conditions.length > 0 ? (
              <button
                type="button"
                onClick={() => clearFilterGroup("conditions")}
                className="shrink-0 touch-manipulation text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          {expanded.condition ? (
            <div className="space-y-1">
              {CONDITION_OPTIONS.map((condition) => (
                <Checkbox
                  key={condition}
                  checked={filters.conditions.includes(condition)}
                  onChange={() => toggleFilter("conditions", condition)}
                  label={condition}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleSection("transmission")}
              className="flex min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-bold uppercase tracking-wider text-gray-mid touch-manipulation"
            >
              Transmission{" "}
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded.transmission ? "rotate-180" : ""}`}
              />
            </button>
            {filters.transmissions.length > 0 ? (
              <button
                type="button"
                onClick={() => clearFilterGroup("transmissions")}
                className="shrink-0 touch-manipulation text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          {expanded.transmission ? (
            <div className="space-y-1">
              {TRANSMISSION_OPTIONS.map((transmission) => (
                <Checkbox
                  key={transmission}
                  checked={filters.transmissions.includes(transmission)}
                  onChange={() => toggleFilter("transmissions", transmission)}
                  label={transmission}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleSection("driveType")}
              className="flex min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-bold uppercase tracking-wider text-gray-mid touch-manipulation"
            >
              Drive Type{" "}
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded.driveType ? "rotate-180" : ""}`}
              />
            </button>
            {filters.driveTypes.length > 0 ? (
              <button
                type="button"
                onClick={() => clearFilterGroup("driveTypes")}
                className="shrink-0 touch-manipulation text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          {expanded.driveType ? (
            <div className="space-y-1">
              {DRIVE_TYPE_OPTIONS.map((driveType) => (
                <Checkbox
                  key={driveType}
                  checked={filters.driveTypes.includes(driveType)}
                  onChange={() => toggleFilter("driveTypes", driveType)}
                  label={driveType}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleSection("badge")}
              className="flex min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-bold uppercase tracking-wider text-gray-mid touch-manipulation"
            >
              Badge{" "}
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded.badge ? "rotate-180" : ""}`}
              />
            </button>
            {filters.badges.length > 0 ? (
              <button
                type="button"
                onClick={() => clearFilterGroup("badges")}
                className="shrink-0 touch-manipulation text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          {expanded.badge ? (
            <div className="space-y-1">
              {BADGE_OPTIONS.map((badge) => (
                <Checkbox
                  key={badge}
                  checked={filters.badges.includes(badge)}
                  onChange={() => toggleFilter("badges", badge)}
                  label={badge}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="mb-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleSection("negotiable")}
              className="flex min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-bold uppercase tracking-wider text-gray-mid touch-manipulation"
            >
              Negotiable{" "}
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded.negotiable ? "rotate-180" : ""}`}
              />
            </button>
            {filters.negotiable !== "all" ? (
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, negotiable: "all" })}
                className="shrink-0 touch-manipulation text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          {expanded.negotiable ? (
            <Select
              ariaLabel="Filter by negotiable"
              value={filters.negotiable}
              onValueChange={(value) => {
                if (value === "all" || value === "yes" || value === "no") {
                  onFiltersChange({ ...filters, negotiable: value });
                }
              }}
              options={[
                { value: "all", label: "All" },
                { value: "yes", label: "Yes" },
                { value: "no", label: "No" },
              ]}
              className="min-h-[44px] sm:min-h-0 sm:py-2 sm:text-sm"
            />
          ) : null}
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleSection("price")}
              className="flex min-w-0 flex-1 items-center gap-1 text-left text-[11px] font-bold uppercase tracking-wider text-gray-mid touch-manipulation"
            >
              Max Price{" "}
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 transition-transform ${expanded.price ? "rotate-180" : ""}`}
              />
            </button>
            {filters.maxPrice < maxPrice ? (
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, maxPrice })}
                className="shrink-0 touch-manipulation text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
              >
                Clear
              </button>
            ) : null}
          </div>
          {expanded.price ? (
            <>
              <input
                type="range"
                min={0}
                max={maxPrice}
                value={filters.maxPrice}
                onChange={(event) =>
                  onFiltersChange({
                    ...filters,
                    maxPrice: Number(event.target.value),
                  })
                }
                className="h-2 w-full cursor-pointer rounded-full accent-primary touch-manipulation sm:h-1.5"
              />
              <p className="mt-2 text-[12px] text-gray-mid sm:mt-1.5">
                max.{" "}
                <span className="font-bold text-font">
                  {filters.maxPrice.toLocaleString()} RWF
                </span>
              </p>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

type FilterSidebarProps = {
  filters: InventoryFilters;
  maxPrice: number;
  onFiltersChange: (filters: InventoryFilters) => void;
};

export const FilterSidebar: React.FC<FilterSidebarProps> = (props) => (
  <aside className="hidden w-full shrink-0 lg:sticky lg:top-24 lg:block lg:w-72 lg:self-start">
    <InventoryFiltersPanel {...props} variant="sidebar" />
  </aside>
);
