"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

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
  searchPlaceholder?: string;
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
  searchPlaceholder = "Search options...",
  name,
  ariaLabel,
  variant = "dark",
  className = "",
  contentClassName = "",
  children,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return normalizedQuery
      ? options.filter((option) =>
          option.label.toLocaleLowerCase().includes(normalizedQuery),
        )
      : options;
  }, [options, query]);
  const safeActiveIndex =
    filteredOptions.length > 0
      ? Math.min(activeIndex, filteredOptions.length - 1)
      : 0;

  useEffect(() => {
    if (open) searchInputRef.current?.focus();
  }, [open]);

  const updateOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
    if (!nextOpen) setQuery("");
    else {
      const selectedIndex = filteredOptions.findIndex(
        (option) => option.value === value,
      );
      setActiveIndex(Math.max(selectedIndex, 0));
    }
  };

  const chooseOption = (option: SelectOption) => {
    if (option.disabled) return;
    onValueChange(option.value);
    updateOpen(false);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => {
        if (filteredOptions.length === 0) return 0;
        for (let offset = 1; offset <= filteredOptions.length; offset++) {
          const nextIndex =
            (current + direction * offset + filteredOptions.length) %
            filteredOptions.length;
          if (!filteredOptions[nextIndex].disabled) return nextIndex;
        }
        return current;
      });
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = filteredOptions[safeActiveIndex];
      if (option) chooseOption(option);
    }
  };

  const triggerClass =
    variant === "light"
      ? "border-gray-200 bg-white text-gray-700"
      : "border-line/30 bg-gray-dark text-font";
  const panelClass =
    variant === "light"
      ? "bg-white text-gray-900"
      : "bg-gray-dark text-font";

  return (
    <Popover.Root open={open} onOpenChange={updateOpen}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listId}
          className={`inline-flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm outline-none transition-colors hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 ${triggerClass} ${className}`}
        >
          <span className={selectedOption ? "" : "text-gray-mid"}>
            {selectedOption?.label ?? placeholder}
          </span>
          {children ?? (
            <ChevronDown
              aria-hidden="true"
              className={`h-4 w-4 shrink-0 text-gray-mid transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={5}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className={`z-[150] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border border-line/30 shadow-xl ${panelClass} ${contentClassName}`}
        >
          <div className="relative border-b border-line/20 p-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-mid"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
              aria-label={ariaLabel ? `Search ${ariaLabel.toLowerCase()}` : searchPlaceholder}
              aria-controls={listId}
              aria-activedescendant={
                filteredOptions[safeActiveIndex]
                  ? `${listId}-${safeActiveIndex}`
                  : undefined
              }
              autoComplete="off"
              className={`w-full rounded-md border border-line/20 py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                variant === "light"
                  ? "bg-white text-gray-900 placeholder:text-gray-500"
                  : "bg-bg text-font placeholder:text-gray-mid"
              }`}
            />
          </div>
          <div
            id={listId}
            role="listbox"
            aria-label={ariaLabel ?? "Options"}
            className="max-h-60 overflow-y-auto p-1"
          >
            {filteredOptions.map((option, index) => (
              <button
                key={option.value}
                id={`${listId}-${index}`}
                type="button"
                role="option"
                aria-selected={option.value === value}
                disabled={option.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => chooseOption(option)}
                className={`relative flex w-full items-center rounded-md py-2 pl-8 pr-3 text-left text-sm outline-none transition-colors disabled:pointer-events-none disabled:opacity-40 ${
                  variant === "light"
                    ? "text-gray-900 hover:bg-primary/10"
                    : "text-font hover:bg-primary/15"
                }                 ${index === safeActiveIndex ? "bg-primary/10" : ""}`}
              >
                <span className="absolute left-2 inline-flex h-4 w-4 items-center justify-center">
                  {option.value === value ? (
                    <Check className="h-4 w-4 text-primary-light" />
                  ) : null}
                </span>
                {option.label}
              </button>
            ))}
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2.5 text-sm text-gray-mid">
                No matching options.
              </p>
            ) : null}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
