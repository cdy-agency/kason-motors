"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  name?: string;
  ariaLabel?: string;
  variant?: "light" | "dark";
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
};

export function Select({
  value,
  options,
  onValueChange,
  onOpenChange,
  placeholder = "Select an option",
  name,
  ariaLabel,
  variant = "dark",
  className = "",
  contentClassName = "",
  children,
}: SelectProps) {
  return (
    <SelectPrimitive.Root
      name={name}
      value={value}
      onValueChange={onValueChange}
      onOpenChange={onOpenChange}
    >
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={`inline-flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm outline-none transition-colors hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 ${
          variant === "light"
            ? "border-gray-200 bg-white text-gray-700"
            : "border-line/30 bg-gray-dark text-font"
        } ${className}`}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        {children ?? (
          <SelectPrimitive.Icon aria-hidden="true">
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-mid" />
          </SelectPrimitive.Icon>
        )}
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={5}
          className={`z-[150] max-h-60 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-line/30 shadow-xl ${
            variant === "light"
              ? "bg-white text-gray-900"
              : "bg-gray-dark text-font"
          } ${contentClassName}`}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className={`relative flex cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-3 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-40 ${
                  variant === "light"
                    ? "data-[highlighted]:bg-primary/10 data-[highlighted]:text-gray-900"
                    : "data-[highlighted]:bg-primary/15 data-[highlighted]:text-font"
                }`}
              >
                <span className="absolute left-2 inline-flex h-4 w-4 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4 text-primary-light" />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
