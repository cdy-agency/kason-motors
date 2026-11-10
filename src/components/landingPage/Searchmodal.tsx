"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Car,
  DollarSign,
  Gauge,
} from "lucide-react";
import { Select } from "@/components/ui/Select";
import {
  BODY_TYPE_OPTIONS,
  BRAND_OPTIONS,
} from "@/components/dashboard/listings/vehicleFormOptions";

// ─── Data ────────────────────────────────────────────────────────────────────

const filters = ["All Conditions", "New Cars", "Used Cars", "Certified"];
const priceRanges = [
  "All Prices",
  "Under 300,000 RWF",
  "300,000–500,000 RWF",
  "500,000–800,000 RWF",
  "800,000–1,200,000 RWF",
  "Above 1,200,000 RWF",
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchState {
  filter: string;
  make: string;
  model: string;
  bodyType: string;
  price: string;
  year: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialField?: string;
  onSearch?: (state: SearchState) => void;
}

type SearchVehicle = {
  id: number;
  brand?: string;
  model?: string;
  condition?: string;
  body_type?: string;
  year?: number | string;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function SelectField({
  label,
  icon: Icon,
  value,
  options,
  onChange,
  active,
  onFocus,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  active: boolean;
  onFocus: () => void;
}) {
  return (
    <div
      className={`relative flex flex-col gap-1.5 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
        active
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-line/25 hover:border-line/50 bg-bg/80"
      }`}
      onClick={onFocus}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={13}
          className={`shrink-0 transition-colors ${active ? "text-primary" : "text-gray-mid"}`}
        />
        <span
          className={`text-[10px] font-black tracking-[0.18em] uppercase transition-colors ${
            active ? "text-primary" : "text-gray-mid"
          }`}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <Select
          ariaLabel={label}
          value={value}
          options={options.map((option) => ({
            value: option,
            label: option,
          }))}
          onValueChange={onChange}
          onOpenChange={(open) => {
            if (open) onFocus();
          }}
          className="!border-0 !bg-transparent !px-0 !py-0 pr-2 text-sm font-semibold text-font shadow-none focus:!ring-0"
        />
      </div>
      {/* Active accent bar */}
      {active && (
        <motion.div
          layoutId="fieldAccent"
          className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full"
        />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SearchModal({
  isOpen,
  onClose,
  initialField,
  onSearch,
}: SearchModalProps) {
  const router = useRouter();
  const [search, setSearch] = useState<SearchState>({
    filter: "All Conditions",
    make: "All Makes",
    model: "All Models",
    bodyType: "All Body Types",
    price: "All Prices",
    year: "All Years",
  });
  const [activeField, setActiveField] = useState<string>(
    initialField ?? "make",
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [carsCount, setCarsCount] = useState(0);
  const [allCars, setAllCars] = useState<SearchVehicle[]>([]);

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const response = await fetch("/api/vehicles/getList");
        const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          setAllCars([]);
          setCarsCount(0);
          return;
        }
        setAllCars(result.data as SearchVehicle[]);
        setCarsCount(result.data.length);
      } catch {
        setAllCars([]);
        setCarsCount(0);
      }
    };
    fetchSearchData();
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleReset = () => {
    setSearch({
      filter: "All Conditions",
      make: "All Makes",
      model: "All Models",
      bodyType: "All Body Types",
      price: "All Prices",
      year: "All Years",
    });
    setShowAdvanced(false);
  };

  const handleSearch = () => {
    onSearch?.(search);
    const params = new URLSearchParams();
    if (search.make !== "All Makes") {
      params.set("brand", search.make);
    }
    if (search.model !== "All Models") {
      params.set("model", search.model);
    }
    if (search.bodyType !== "All Body Types") {
      params.set("bodyType", search.bodyType);
    }
    if (search.filter !== "All Conditions") {
      const condition =
        search.filter === "New Cars"
          ? "New"
          : search.filter === "Used Cars"
            ? "Used"
            : search.filter === "Certified"
              ? "Certified"
              : "";
      if (condition) {
        params.set("condition", condition);
      }
    }
    if (search.year !== "All Years") {
      if (search.year === "2019 & older") {
        params.set("maxYear", "2019");
      } else {
        params.set("year", search.year);
      }
    }
    if (search.price !== "All Prices") {
      const maxPriceByLabel: Record<string, number> = {
        "Under 300,000 RWF": 300000,
        "300,000–500,000 RWF": 500000,
        "500,000–800,000 RWF": 800000,
        "800,000–1,200,000 RWF": 1200000,
      };
      if (maxPriceByLabel[search.price]) {
        params.set("maxPrice", String(maxPriceByLabel[search.price]));
      }
    }
    router.push(`/inventory${params.toString() ? `?${params.toString()}` : ""}`);
    onClose();
  };

  const makeOptions = [
    "All Makes",
    ...Array.from(
      new Set(
        [
          ...BRAND_OPTIONS,
          ...allCars
            .map((car) => (car.brand || "").trim())
            .filter((brand) => brand.length > 0),
        ],
      ),
    ).sort((a, b) => a.localeCompare(b)),
  ];

  const availableModels = [
    "All Models",
    ...Array.from(
      new Set(
        allCars
          .filter((car) =>
            search.make === "All Makes"
              ? true
              : (car.brand || "").trim().toLowerCase() === search.make.toLowerCase(),
          )
          .map((car) => (car.model || "").trim())
          .filter((model) => model.length > 0),
      ),
    ).sort((a, b) => a.localeCompare(b)),
  ];

  const bodyTypeOptions = [
    "All Body Types",
    ...Array.from(
      new Set(
        [
          ...BODY_TYPE_OPTIONS,
          ...allCars
            .map((car) => (car.body_type || "").trim())
            .filter((type) => type.length > 0),
        ],
      ),
    ).sort((a, b) => a.localeCompare(b)),
  ];

  const yearOptions = [
    "All Years",
    ...Array.from(
      new Set(
        allCars
          .map((car) => String(car.year ?? "").trim())
          .filter((year) => year.length > 0 && year !== "0"),
      ),
    )
      .sort((a, b) => Number(b) - Number(a)),
    "2019 & older",
  ];

  // Count active filters
  const activeCount = [
    search.make !== "All Makes",
    search.model !== "All Models",
    search.bodyType !== "All Body Types",
    search.price !== "All Prices",
    search.filter !== "All Conditions",
    search.year !== "All Years",
  ].filter(Boolean).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/70 backdrop-blur-sm z-[80]"
          />

          {/* ── Modal Panel ──
               Mobile  → full-width sheet from bottom
               Desktop → centered card                 */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="
              fixed z-[90] bg-gray-dark text-font shadow-2xl overflow-hidden
              /* Mobile: bottom sheet */
              bottom-0 left-0 right-0 rounded-t-3xl
              /* Desktop: centered modal */
              md:bottom-auto md:top-1/2 md:left-1/2
              md:-translate-x-1/2 md:-translate-y-1/2
              md:w-full md:max-w-3xl md:rounded-2xl
            "
          >
            {/* ── Drag handle (mobile only) ── */}
            <div className="md:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-line/40" />
            </div>

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-line/25">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8  bg-primary/10 flex items-center justify-center">
                  <Search size={15} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-font tracking-tight">
                    Find Your Car
                  </h2>
                  <p className="text-xs text-gray-mid font-medium">
                    {activeCount > 0
                      ? `${activeCount} filter${activeCount > 1 ? "s" : ""} applied`
                      : `${carsCount} cars available`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-bg hover:bg-ink flex items-center justify-center transition-colors"
              >
                <X size={15} className="text-font" />
              </button>
            </div>

            {/* ── Filter Tabs ── */}
            <div className="px-5 sm:px-7 pt-4 pb-2">
              <p className="text-[10px] font-black text-gray-mid tracking-[0.2em] uppercase mb-2.5">
                I&apos;m Looking For
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {filters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSearch((p) => ({ ...p, filter: f }))}
                    className={`relative px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase transition-all duration-200 ${
                      search.filter === f
                        ? "text-font bg-primary shadow-md shadow-primary/25"
                        : "text-gray-mid bg-bg hover:bg-ink hover:text-font"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Fields ── */}
            <div className="px-5 sm:px-7 py-4 max-h-[52vh] md:max-h-none overflow-y-auto">
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <SelectField
                  label="Make"
                  icon={Car}
                  value={search.make}
                  options={makeOptions}
                  onChange={(v) =>
                    setSearch((p) => ({ ...p, make: v, model: "All Models" }))
                  }
                  active={activeField === "make"}
                  onFocus={() => setActiveField("make")}
                />
                <SelectField
                  label="Model"
                  icon={Gauge}
                  value={search.model}
                  options={availableModels}
                  onChange={(v) => setSearch((p) => ({ ...p, model: v }))}
                  active={activeField === "model"}
                  onFocus={() => setActiveField("model")}
                />
                <SelectField
                  label="Body Type"
                  icon={Car}
                  value={search.bodyType}
                  options={bodyTypeOptions}
                  onChange={(v) => setSearch((p) => ({ ...p, bodyType: v }))}
                  active={activeField === "bodyType"}
                  onFocus={() => setActiveField("bodyType")}
                />
              </div>

              {/* Advanced toggle */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mt-2.5">
                      <SelectField
                        label="Year"
                        icon={Car}
                        value={search.year}
                        options={yearOptions}
                        onChange={(v) => setSearch((p) => ({ ...p, year: v }))}
                        active={activeField === "year"}
                        onFocus={() => setActiveField("year")}
                      />
                      <SelectField
                        label="Price"
                        icon={DollarSign}
                        value={search.price}
                        options={priceRanges}
                        onChange={(v) => setSearch((p) => ({ ...p, price: v }))}
                        active={activeField === "price"}
                        onFocus={() => setActiveField("price")}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Footer ── */}
            <div className="px-5 sm:px-7 py-4 border-t border-line/25 bg-bg/90 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAdvanced((p) => !p)}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-mid hover:text-primary uppercase tracking-widest transition-colors"
                >
                  <SlidersHorizontal size={13} />
                  <span>{showAdvanced ? "Less" : "Advanced"}</span>
                </button>
                {activeCount > 0 && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs font-bold text-gray-mid hover:text-accent uppercase tracking-widest transition-colors"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSearch}
                className="flex items-center gap-2 px-7 py-3 bg-primary text-font font-bold rounded-xl text-sm uppercase tracking-widest shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
              >
                <Search size={15} />
                Search Cars
                {activeCount > 0 && (
                  <span className="ml-1 bg-font/15 text-font text-[10px] font-black rounded-full px-1.5 py-0.5">
                    {activeCount}
                  </span>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
