"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "@/components/landingPage/Navbar";
import Footer from "@/components/landingPage/Footer";
import { DatePicker } from "@/components/ui/DatePicker";

type CarSummary = {
  id: number;
  name?: string | null;
  title?: string | null;
  brand?: string | null;
  model?: string | null;
  body_type?: string | null;
  type?: string | null;
  year?: number | null;
  price?: number | null;
  condition?: string | null;
};

const formSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z
    .string()
    .min(7, "Phone number must be at least 7 digits")
    .regex(/^[+\d\s\-()]+$/, "Enter a valid phone number"),
  preferredDate: z.string().min(1, "Pick a preferred date"),
  notes: z.string().max(2000).optional(),
});

type FormData = z.infer<typeof formSchema>;
type FormErrors = Partial<Record<keyof FormData, string>>;

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(price);
}

function todayIsoDate() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function TestDriverBooking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const carIdParam = searchParams.get("carId")?.trim() ?? "";

  const [car, setCar] = useState<CarSummary | null>(null);
  const [loadingCar, setLoadingCar] = useState(true);
  const [carError, setCarError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    preferredDate: "",
    notes: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const carIdNum = useMemo(() => {
    const n = Number(carIdParam);
    return Number.isFinite(n) && n > 0 ? n : NaN;
  }, [carIdParam]);

  useEffect(() => {
    if (!carIdParam || Number.isNaN(carIdNum)) {
      setLoadingCar(false);
      setCarError("missing");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoadingCar(true);
        setCarError(null);
        const res = await fetch(`/api/vehicles/getById/${carIdNum}`);
        const result = await res.json();
        if (cancelled) return;
        if (!res.ok || !result.success || !result.data) {
          setCar(null);
          setCarError("notfound");
          return;
        }
        setCar(result.data as CarSummary);
      } catch {
        if (!cancelled) {
          setCar(null);
          setCarError("load");
        }
      } finally {
        if (!cancelled) setLoadingCar(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [carIdParam, carIdNum]);

  const carTitle = useMemo(() => {
    if (!car) return "";
    const t = (car.title || "").trim();
    if (t) return t;
    const n = (car.name || "").trim();
    if (n) return n;
    const b = (car.brand || "").trim();
    const m = (car.model || "").trim();
    if (b || m) return `${b} ${m}`.trim();
    return "Vehicle";
  }, [car]);

  const bodyType = (car?.body_type || car?.type || "—").trim() || "—";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (touched) {
      const next = { ...form, [name]: value };
      const r = formSchema.safeParse(next);
      if (!r.success) {
        const fe = r.error.flatten().fieldErrors as Record<string, string[]>;
        const key = name as keyof FormData;
        setErrors((prev) => ({
          ...prev,
          [key]: fe[key]?.[0],
        }));
      } else {
        setErrors((prev) => ({ ...prev, [name as keyof FormData]: undefined }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const result = formSchema.safeParse(form);
    if (!result.success) {
      const fe = result.error.flatten().fieldErrors;
      setErrors({
        fullName: fe.fullName?.[0],
        email: fe.email?.[0],
        phone: fe.phone?.[0],
        preferredDate: fe.preferredDate?.[0],
        notes: fe.notes?.[0],
      });
      return;
    }

    if (!car) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/book-test-drive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: car.id,
          fullName: result.data.fullName,
          email: result.data.email,
          phone: result.data.phone,
          preferredDate: result.data.preferredDate,
          notes: result.data.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || "Could not submit booking");
        return;
      }
      toast.success("Test drive request sent. We will contact you soon.");
      setForm({
        fullName: "",
        email: "",
        phone: "",
        preferredDate: "",
        notes: "",
      });
      setTouched(false);
      setErrors({});
      router.push("/inventory");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: keyof FormData) =>
    `w-full rounded-lg border bg-bg px-3 py-2.5 text-sm text-font placeholder:text-gray-mid focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
      errors[field] ? "border-primary" : "border-line/30"
    }`;

  if (!carIdParam || Number.isNaN(carIdNum)) {
    return (
      <div className="min-h-screen bg-bg text-font">
        <ToastContainer theme="dark" className="!top-20" />
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-font/80">No vehicle selected.</p>
          <Link
            href="/inventory"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Browse inventory
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (loadingCar) {
    return (
      <div className="min-h-screen bg-bg text-font">
        <Navbar />
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (carError === "notfound" || carError === "load" || !car) {
    return (
      <div className="min-h-screen bg-bg text-font">
        <ToastContainer theme="dark" className="!top-20" />
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <p className="text-primary">
            {carError === "load"
              ? "Could not load this vehicle."
              : "Vehicle not found."}
          </p>
          <Link
            href="/inventory"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Back to inventory
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-font">
      <ToastContainer theme="dark" className="!top-20" />
      <Navbar />

      <div className="border-b border-line/25 bg-gray-dark px-4 py-3 text-sm text-gray-mid md:px-12">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/inventory" className="hover:text-primary">
          Inventory
        </Link>
        <span className="mx-2">/</span>
        <span className="text-font">Book test drive</span>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-font md:text-3xl">
          Book a test drive
        </h1>
        <p className="mt-1 text-sm text-font/75">
          Confirm the vehicle below, then add your details and preferred date.
        </p>

        <section className="mt-8 rounded-xl border border-line/25 bg-gray-dark p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">
            Vehicle (read only)
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-line/15 pb-2">
              <dt className="text-gray-mid">Vehicle</dt>
              <dd className="text-right font-semibold text-font">{carTitle}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line/15 pb-2">
              <dt className="text-gray-mid">Type</dt>
              <dd className="text-right text-font">{bodyType}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line/15 pb-2">
              <dt className="text-gray-mid">Year</dt>
              <dd className="text-right text-font">{car.year ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-line/15 pb-2">
              <dt className="text-gray-mid">Condition</dt>
              <dd className="text-right text-font">{car.condition ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-mid">Listed price</dt>
              <dd className="text-right font-bold text-primary">
                {formatPrice(Number(car.price || 0))}
              </dd>
            </div>
          </dl>
        </section>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-font/85">
              Full name
            </label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className={inputClass("fullName")}
              placeholder="Your full name"
              autoComplete="name"
            />
            {errors.fullName ? (
              <p className="mt-1 text-xs text-accent">{errors.fullName}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-font/85">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass("email")}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-accent">{errors.email}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-font/85">
              Phone number
            </label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+250 700 000 000"
              className={inputClass("phone")}
              autoComplete="tel"
            />
            {errors.phone ? (
              <p className="mt-1 text-xs text-accent">{errors.phone}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-font/85">
              Preferred date
            </label>
            <DatePicker
              value={form.preferredDate}
              onChange={(preferredDate) =>
                setForm((current) => ({ ...current, preferredDate }))
              }
              minDate={new Date(`${todayIsoDate()}T00:00:00`)}
              placeholder="Choose a preferred date"
              ariaLabel="Preferred date"
              className={
                errors.preferredDate ? "border-primary" : "border-line/30"
              }
            />
            {errors.preferredDate ? (
              <p className="mt-1 text-xs text-accent">{errors.preferredDate}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-font/85">
              Notes <span className="text-gray-mid">(optional)</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              value={form.notes}
              onChange={handleChange}
              placeholder="Time of day, questions, etc."
              className={`${inputClass("notes")} resize-none`}
            />
            {errors.notes ? (
              <p className="mt-1 text-xs text-accent">{errors.notes}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[48px] flex-1 rounded-xl bg-primary py-3 text-sm font-bold uppercase tracking-widest text-font transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Submit request"}
            </button>
            <Link
              href={`/inventory/${car.id}`}
              className="flex min-h-[48px] flex-1 items-center justify-center rounded-xl border border-line/30 py-3 text-center text-sm font-semibold text-font hover:bg-white/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
