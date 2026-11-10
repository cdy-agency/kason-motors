"use client";

import React from "react";
import { Select } from "@/components/ui/Select";

type ResultsHeaderProps = {
  count: number;
  search: string;
  sort: string;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
};

const SORT_OPTIONS = ["Newest", "Price: Low to High", "Price: High to Low"] as const;

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  count,
  search,
  sort,
  onSearchChange,
  onSortChange,
}) => {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="shrink-0 text-sm text-gray-mid">
        <span className="font-bold text-font">{count}</span> results
      </p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch sm:justify-end">
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by title, brand, model..."
          className="min-h-[44px] w-full min-w-0 rounded-lg border border-line/30 bg-gray-dark px-3 py-2.5 text-base text-font placeholder:text-gray-mid focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:min-h-0 sm:max-w-md sm:flex-1 sm:py-2 sm:text-sm lg:w-72 lg:flex-none"
        />
        <Select
          ariaLabel="Sort inventory"
          value={sort}
          onValueChange={onSortChange}
          options={SORT_OPTIONS.map((option) => ({
            value: option,
            label: option,
          }))}
          className="min-h-[44px] w-full shrink-0 sm:min-h-0 sm:w-auto sm:min-w-[11rem] sm:py-2 sm:text-sm"
        />
      </div>
    </div>
  );
};
