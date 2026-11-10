"use client";

import * as Popover from "@radix-ui/react-popover";
import { CalendarDays } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { useState } from "react";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  minDate?: Date;
  placeholder?: string;
  className?: string;
};

function parseIsoDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  ariaLabel,
  minDate,
  placeholder = "Select a date",
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseIsoDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const earliestDate = minDate ? new Date(minDate) : undefined;
  earliestDate?.setHours(0, 0, 0, 0);
  const disabledBefore = earliestDate ?? today;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={`inline-flex w-full items-center justify-between gap-2 rounded-lg border border-line/30 bg-bg px-3 py-2.5 text-left text-sm text-font outline-none transition-colors hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/30 ${className}`}
        >
          <span className={value ? "" : "text-gray-mid"}>
            {selectedDate
              ? new Intl.DateTimeFormat("en-RW", { dateStyle: "long" }).format(
                  selectedDate,
                )
              : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-gray-mid" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={5}
          className="z-[150] rounded-lg border border-line/30 bg-gray-dark p-2 text-font shadow-xl"
        >
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              onChange(date ? formatIsoDate(date) : "");
              if (date) setOpen(false);
            }}
            disabled={{ before: disabledBefore }}
            startMonth={disabledBefore}
            className="kason-calendar"
            classNames={{
              root: "w-fit p-2",
              month: "space-y-4",
              month_caption: "relative flex h-8 items-center justify-center",
              caption_label: "text-sm font-semibold text-font",
              nav: "flex items-center gap-1",
              button_previous:
                "absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-mid hover:bg-primary/15 hover:text-font",
              button_next:
                "absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-mid hover:bg-primary/15 hover:text-font",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday: "w-9 text-center text-xs font-medium text-gray-mid",
              week: "mt-1 flex w-full",
              day: "relative h-9 w-9 p-0 text-center text-sm",
              day_button:
                "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium text-font hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary",
              selected: "[&>button]:bg-primary [&>button]:text-white",
              disabled: "[&>button]:pointer-events-none [&>button]:opacity-35",
              today: "[&>button]:ring-1 [&>button]:ring-primary/60",
              outside: "opacity-35",
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
