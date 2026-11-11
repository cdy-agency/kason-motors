"use client";

import Image from "next/image";
import Link from "next/link";
import { Car, formatMileage, normalizeCarImages } from "@/types/car";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CARS_CACHE_KEY = "admin-cars-cache-v1";
const CARS_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedCarsPayload = {
  data: Car[];
  cachedAt: number;
};

export default function VehicleList() {
  const [cars, setCars] = useState<Car[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [stockEdits, setStockEdits] = useState<Record<number, string>>({});
  const [stockSavingId, setStockSavingId] = useState<number | null>(null);
  const [stockSellingId, setStockSellingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const readCachedCars = () => {
    try {
      const rawCache = sessionStorage.getItem(CARS_CACHE_KEY);
      if (!rawCache) {
        return null;
      }
      const parsed = JSON.parse(rawCache) as CachedCarsPayload;
      const isFresh = Date.now() - parsed.cachedAt < CARS_CACHE_TTL_MS;
      if (!isFresh) {
        return null;
      }
      return parsed.data;
    } catch {
      return null;
    }
  };

  const writeCachedCars = (nextCars: Car[]) => {
    try {
      const payload: CachedCarsPayload = {
        data: nextCars,
        cachedAt: Date.now(),
      };
      sessionStorage.setItem(CARS_CACHE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore cache write failures.
    }
  };

  const syncCars = (nextCars: Car[]) => {
    setCars(nextCars);
    writeCachedCars(nextCars);
  };

  const formatStockValue = (car: Car) =>
    stockEdits[car.id] ?? String(car.stock_count ?? car.stockCount ?? 0);

  const handleStockInputChange = (carId: number, value: string) => {
    setStockEdits((prev) => ({ ...prev, [carId]: value }));
  };

  const handleStockUpdate = async (car: Car, nextStockCount: number) => {
    if (!Number.isInteger(nextStockCount) || nextStockCount < 0) {
      toast.error("Stock count must be a whole number greater than or equal to 0", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setStockSavingId(car.id);

    try {
      const response = await fetch(`/api/vehicles/stock/${car.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockCount: nextStockCount }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update stock");
      }

      const nextCars = cars.map((item) =>
        item.id === car.id
          ? { ...item, stock_count: nextStockCount }
          : item
      );
      syncCars(nextCars);
      setStockEdits((prev) => ({ ...prev, [car.id]: String(nextStockCount) }));
      toast.success("Stock count updated", {
        position: "top-right",
        autoClose: 2500,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update stock",
        { position: "top-right", autoClose: 4000 }
      );
    } finally {
      setStockSavingId(null);
    }
  };

  const handleUpdateStock = async (car: Car) => {
    const rawValue = formatStockValue(car);
    const nextStockCount = Number(rawValue);
    await handleStockUpdate(car, nextStockCount);
  };

  const handleSold = async (car: Car) => {
    const currentStock = Number(car.stock_count ?? car.stockCount ?? 0);
    if (currentStock <= 0) {
      toast.error("Stock is already zero", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setStockSellingId(car.id);
    await handleStockUpdate(car, currentStock - 1);
    setStockSellingId(null);
  };

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const cachedCars = readCachedCars();
        if (cachedCars) {
          setCars(cachedCars);
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/vehicles/getList");
        const result = (await response.json()) as {
          success?: boolean;
          data?: Car[];
          message?: string;
        };

        if (response.ok && result.success && Array.isArray(result.data)) {
          setCars(result.data);
          writeCachedCars(result.data);
          setIsLoading(false);
          return;
        }

        throw new Error(result.message || "Failed to load vehicles.");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load vehicles.";
        setLoadError(message);
        toast.error(message, { position: "top-right", autoClose: 4000 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCars();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/vehicles/delete/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(`Delete failed: ${result.message ?? "Unknown error"}`, {
          position: "top-right",
          autoClose: 4000,
        });
        return;
      }

      setCars((prev) => {
        const nextCars = prev.filter((car) => car.id !== id);
        try {
          const payload: CachedCarsPayload = {
            data: nextCars,
            cachedAt: Date.now(),
          };
          sessionStorage.setItem(CARS_CACHE_KEY, JSON.stringify(payload));
        } catch {
          // Ignore cache write failures.
        }
        return nextCars;
      });
      toast.success("Vehicle deleted successfully!", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch {
      toast.error("Something went wrong while deleting.", {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setDeleteId(null);
    }
  };

  const normalizeSearchText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase()
      .trim();

  const searchTerms = normalizeSearchText(search).split(/\s+/).filter(Boolean);
  const filteredCars = cars.filter((car) => {
    const searchableText = normalizeSearchText(
      [
        car.title,
        car.brand,
        car.model,
        car.name,
        car.category,
        car.type,
        car.condition,
        car.bodyType,
        car.driveType,
        car.year,
        car.price,
        car.mileage,
        car.stock_count,
        car.stockCount,
        car.fuel,
        car.transmission,
        car.badge,
        car.exteriorColor,
        car.interiorColor,
        car.description,
        ...(Array.isArray(car.features) ? car.features : []),
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" "),
    );

    return searchTerms.every((term) => searchableText.includes(term));
  });
  const pageCount = Math.max(1, Math.ceil(filteredCars.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedCars = filteredCars.slice(pageStart, pageStart + pageSize);
  const firstVisiblePage = Math.max(
    1,
    Math.min(currentPage - 2, pageCount - 4),
  );
  const visiblePages = Array.from(
    { length: Math.min(pageCount, 5) },
    (_, index) => firstVisiblePage + index,
  );

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [currentPage, page]);

  const primaryImageFor = (car: Car) =>
    normalizeCarImages(car.image, car.image_urls ?? car.imageUrls)[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-primary/5 to-gray-100 py-10 px-4">
      <ToastContainer />

      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Vehicles
              </h1>
              <p className="text-sm text-gray-500">
                {cars.length} vehicle{cars.length !== 1 ? "s" : ""} listed
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />
              <input
                aria-label="Search vehicles"
                placeholder="Search vehicles..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                className="w-full border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900 caret-primary shadow-sm transition-all placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  aria-label="Clear vehicle search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 transition hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <Link
              href="/admin/listings/upload"
              className="inline-flex shrink-0 items-center justify-center gap-2 bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark"
            >
              <Plus size={17} />
              Add vehicle
            </Link>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-primary via-primary/40 to-transparent mb-6" />

        {loadError && (
          <p
            role="alert"
            className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {loadError}
          </p>
        )}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
          <p aria-live="polite">
            {search.trim()
              ? `${filteredCars.length} matching vehicle${filteredCars.length === 1 ? "" : "s"}`
              : `${cars.length} vehicle${cars.length === 1 ? "" : "s"}`}
          </p>
          <label className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium text-gray-500">
                Loading vehicles...
              </p>
            </div>
          ) : filteredCars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <svg
                className="w-14 h-14 mb-4 text-gray-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"
                />
              </svg>
              <p className="text-lg font-semibold text-gray-300">
                {search.trim() ? "No matching vehicles" : "No vehicles found"}
              </p>
              <p className="text-sm mt-1">
                {search.trim()
                  ? "Try a different search term or clear your search."
                  : "Upload a vehicle to see it here"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Vehicle
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Category
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Type
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Price
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Year
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Mileage
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Stock
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Stock Actions
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Fuel
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Transmission
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Badge
                    </th>
                    {/* Full Option column ── NEW */}
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Full Option
                    </th>
                    <th className="text-center px-4 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedCars.map((car) => {
                    const previewImage = primaryImageFor(car);

                    return (
                      <tr
                        key={car.id}
                        className="hover:bg-primary/5 transition-colors duration-150 group"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="relative w-14 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100 shadow-sm">
                              {previewImage ? (
                                <Image
                                  src={previewImage}
                                  alt={car.name}
                                  fill
                                  unoptimized
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg
                                    className="w-5 h-5 text-gray-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <span className="font-semibold text-gray-800 whitespace-nowrap">
                              {car.name || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {car.category || "-"}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {car.type || "-"}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-primary whitespace-nowrap">
                          {car.price
                            ? `RWF ${Number(car.price).toLocaleString()}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {car.year || "-"}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {formatMileage(car.mileage)}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={formatStockValue(car)}
                            onChange={(event) =>
                              handleStockInputChange(car.id, event.target.value)
                            }
                            className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateStock(car)}
                              disabled={stockSavingId === car.id}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:cursor-not-allowed disabled:bg-primary/40"
                            >
                              {stockSavingId === car.id ? "Saving" : "Save"}
                            </button>
                            <button
                              onClick={() => handleSold(car)}
                              disabled={stockSellingId === car.id}
                              className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:cursor-not-allowed disabled:bg-emerald-100"
                            >
                              {stockSellingId === car.id ? "Selling" : "Sold"}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {car.fuel || "-"}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                          {car.transmission || "-"}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {car.badge ? (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                car.badge === "Featured"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              {car.badge}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>
                        {/* Full Option cell ── NEW */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {car.fullOption ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                              {/* Star icon */}
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              Yes
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/admin/listings/${car.id}/edit`}
                              className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors duration-150"
                              title="Edit"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z"
                                />
                              </svg>
                            </Link>
                            <button
                              onClick={() => setDeleteId(Number(car.id))}
                              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center transition-colors duration-150"
                              title="Delete"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredCars.length > 0 && (
          <div className="mt-4 flex flex-col gap-3 border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Showing {pageStart + 1}–{Math.min(pageStart + pageSize, filteredCars.length)} of{" "}
              {filteredCars.length} vehicle{filteredCars.length === 1 ? "" : "s"}
            </p>
            <nav
              aria-label="Vehicle inventory pages"
              className="flex items-center justify-center gap-1"
            >
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>
              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  aria-label={`Page ${pageNumber}`}
                  aria-current={currentPage === pageNumber ? "page" : undefined}
                  className={`h-9 min-w-9 border px-2 text-sm font-semibold transition ${
                    currentPage === pageNumber
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === pageCount}
                aria-label="Next page"
                className="flex h-9 w-9 items-center justify-center border border-gray-200 text-gray-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </nav>
          </div>
        )}
      </div>

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Delete Vehicle?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone. The vehicle will be permanently
                removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
