"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import type { HeroSlide } from "@/lib/hero";

type SlidesResponse = {
  slides?: HeroSlide[];
  error?: string;
};

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
};

const newSlide = (): HeroSlide => ({
  id: crypto.randomUUID(),
  title: "NEW ARRIVAL",
  car: "",
  price: "",
  period: "",
  description: "",
  image: "",
});

export default function HeroBannersManager() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [draft, setDraft] = useState<HeroSlide | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HeroSlide | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const uploadingRef = useRef(false);
  const activeModalId = draft?.id ?? pendingDelete?.id;

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const response = await fetch("/api/hero");
        const result = (await response.json()) as SlidesResponse;
        if (!response.ok || !Array.isArray(result.slides)) {
          throw new Error(result.error || "Failed to load hero banners.");
        }
        setSlides(result.slides);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load hero banners.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadSlides();
  }, []);

  useEffect(() => {
    if (!activeModalId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !uploadingRef.current) {
        setDraft(null);
        setEditingId(null);
        setPendingDelete(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    modalRef.current?.querySelector<HTMLElement>("input, button")?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalId]);

  const closeEditor = () => {
    setDraft(null);
    setEditingId(null);
  };

  const openNewBanner = () => {
    if (slides.length >= 10) return;
    setError("");
    setDraft(newSlide());
    setEditingId(null);
  };

  const openEditBanner = (slide: HeroSlide) => {
    setError("");
    setDraft({ ...slide });
    setEditingId(slide.id);
  };

  const updateDraft = (updates: Partial<HeroSlide>) => {
    setDraft((current) => (current ? { ...current, ...updates } : current));
  };

  const saveDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    if (!isHttpsUrl(draft.image)) {
      setError("Enter a valid HTTPS image URL or upload an image.");
      return;
    }

    if (editingId) {
      setSlides((current) =>
        current.map((slide) => (slide.id === editingId ? draft : slide)),
      );
    } else {
      setSlides((current) => [...current, draft]);
    }
    setError("");
    setNotice("");
    closeEditor();
  };

  const moveSlide = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= slides.length ||
      toIndex >= slides.length
    ) {
      return;
    }

    setSlides((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered;
    });
    setNotice("");
  };

  const uploadImage = async (slideId: string, file: File) => {
    setError("");
    setNotice("");
    uploadingRef.current = true;
    setUploadingId(slideId);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/admin/hero/upload", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        imageUrl?: string;
        error?: string;
      };

      if (!response.ok || !result.imageUrl) {
        throw new Error(result.error || "Failed to upload hero image.");
      }
      updateDraft({ image: result.imageUrl });
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload hero image.",
      );
    } finally {
      uploadingRef.current = false;
      setUploadingId(null);
    }
  };

  const confirmDeleteSlide = () => {
    if (!pendingDelete) return;
    setSlides((current) =>
      current.filter((slide) => slide.id !== pendingDelete.id),
    );
    setPendingDelete(null);
    setNotice("");
  };

  const saveSlides = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });
      const result = (await response.json()) as SlidesResponse;
      if (!response.ok || !Array.isArray(result.slides)) {
        throw new Error(result.error || "Failed to save hero banners.");
      }
      setSlides(result.slides);
      setNotice("Hero banners saved. Your landing page is now updated.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save hero banners.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-4">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-950 via-gray-900 to-primary-dark px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
        <div className="absolute -right-14 -top-24 h-64 w-64 rounded-full border-[32px] border-white/5" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-green-300">
              Website content · Landing page
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Hero banners
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base">
              Arrange your homepage showcase by dragging banners into place.
              Edit each image and message whenever you need.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white/85">
              {slides.length} / 10 slides
            </span>
            <button
              type="button"
              onClick={openNewBanner}
              disabled={slides.length >= 10 || loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus size={17} /> Add banner
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div>
          <p className="text-sm font-bold text-gray-900">
            Your homepage slideshow
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Drag a card to reorder it. The slideshow rotates every 5 seconds.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800">
          <span
            className={`h-2 w-2 rounded-full ${
              slides.length ? "bg-green-500" : "bg-gray-400"
            }`}
          />
          {slides.length
            ? `${slides.length} ${slides.length === 1 ? "banner" : "banners"} in rotation`
            : "No banners added"}
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {notice}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white"
            >
              <div className="h-40 bg-gray-200" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-2/3 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={saveSlides} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {slides.map((slide, index) => (
              <article
                key={slide.id}
                draggable
                onDragStart={(event) => {
                  setDraggedId(slide.id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", slide.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDropTargetId(slide.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const sourceId = event.dataTransfer.getData("text/plain") || draggedId;
                  const fromIndex = slides.findIndex((item) => item.id === sourceId);
                  const toIndex = slides.findIndex((item) => item.id === slide.id);
                  moveSlide(fromIndex, toIndex);
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setDropTargetId(null);
                }}
                className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
                  dropTargetId === slide.id && draggedId !== slide.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-gray-200 hover:-translate-y-0.5 hover:shadow-md"
                } ${draggedId === slide.id ? "opacity-45" : ""}`}
              >
                <div className="relative h-40 overflow-hidden bg-gray-900">
                  {isHttpsUrl(slide.image) && (
                    <Image
                      src={slide.image}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/20" />
                  <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                    Slide {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="absolute right-3 top-3 rounded-lg bg-black/35 p-1.5 text-white backdrop-blur-sm"
                    title="Drag card to reorder"
                    aria-label="Drag card to reorder"
                  >
                    <GripVertical size={18} />
                  </span>
                  <div className="absolute inset-x-4 bottom-4 text-white">
                    <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-green-300">
                      {slide.title || "Banner"}
                    </p>
                    <h2 className="mt-1 line-clamp-1 text-lg font-bold">
                      {slide.car || "Untitled banner"}
                    </h2>
                    <p className="mt-0.5 truncate text-xs text-white/75">
                      {[slide.price, slide.period].filter(Boolean).join(" ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <p className="line-clamp-1 min-w-0 flex-1 px-1 text-xs text-gray-500">
                    {slide.description || "No description"}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSlide(index, index - 1)}
                      disabled={index === 0}
                      aria-label={`Move banner ${index + 1} up`}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(index, index + 1)}
                      disabled={index === slides.length - 1}
                      aria-label={`Move banner ${index + 1} down`}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditBanner(slide)}
                      aria-label={`Edit banner ${index + 1}`}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(slide)}
                      aria-label={`Delete banner ${index + 1}`}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {slides.length < 10 && (
              <button
                type="button"
                onClick={openNewBanner}
                className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white/60 p-6 text-center transition hover:border-primary hover:bg-primary/5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Plus size={22} />
                </span>
                <span>
                  <span className="block text-sm font-bold text-gray-800">
                    {slides.length ? "Add another banner" : "Add your first banner"}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    Create a homepage slide with your own image and copy
                  </span>
                </span>
              </button>
            )}
          </div>

          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white/95 px-5 py-4 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:px-6">
            <div>
              <p className="text-sm font-bold text-gray-900">
                {slides.length} of 10 banners
              </p>
              <p className="text-xs text-gray-500">
                Save to publish your order and edits on the homepage.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving || uploadingId !== null || draft !== null}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving changes…" : "Save & publish"}
            </button>
          </div>
        </form>
      )}

      {draft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/65 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && uploadingId === null) {
              closeEditor();
            }
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="hero-editor-title"
            className="max-h-[min(92dvh,900px)] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Homepage slideshow
                </p>
                <h2
                  id="hero-editor-title"
                  className="mt-1 text-xl font-bold text-gray-900"
                >
                  {editingId ? "Edit banner" : "Add a banner"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                disabled={uploadingId !== null}
                aria-label="Close banner editor"
                className="rounded-xl p-2.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveDraft} className="space-y-5 p-5 sm:p-7">
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <div className="relative isolate flex min-h-[220px] items-end overflow-hidden rounded-2xl bg-gray-900 p-5 sm:min-h-[260px] sm:p-7">
                {isHttpsUrl(draft.image) && (
                  <Image
                    src={draft.image}
                    alt=""
                    fill
                    unoptimized
                    className="-z-20 object-cover"
                    sizes="(max-width: 768px) 100vw, 700px"
                  />
                )}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
                {!isHttpsUrl(draft.image) && (
                  <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_75%_35%,rgba(76,175,80,0.28),transparent_35%),linear-gradient(135deg,#111827,#1f2937_55%,#14532d)]" />
                )}
                <div className="max-w-xl text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-green-300">
                    {draft.title || "Your banner label"}
                  </p>
                  <p className="mt-2 text-2xl font-bold leading-tight sm:text-4xl">
                    {draft.car || "Your banner headline"}
                  </p>
                  {(draft.price || draft.period) && (
                    <p className="mt-2 font-bold text-green-300">
                      {draft.price}{" "}
                      <span className="text-sm font-medium text-white/75">
                        {draft.period}
                      </span>
                    </p>
                  )}
                  <p className="mt-2 line-clamp-2 text-sm text-white/75">
                    {draft.description || "Your banner description appears here."}
                  </p>
                </div>
                <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  Live preview
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold text-gray-700">
                  Eyebrow
                  <input
                    value={draft.title}
                    maxLength={80}
                    onChange={(event) => updateDraft({ title: event.target.value })}
                    placeholder="LIMITED EDITION"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-gray-700">
                  Headline
                  <input
                    value={draft.car}
                    required
                    maxLength={100}
                    onChange={(event) => updateDraft({ car: event.target.value })}
                    placeholder="Porsche Cayenne"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-gray-700">
                  Price or callout
                  <input
                    value={draft.price}
                    maxLength={40}
                    onChange={(event) => updateDraft({ price: event.target.value })}
                    placeholder="625,000 RWF"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-gray-700">
                  Price suffix
                  <input
                    value={draft.period}
                    maxLength={30}
                    onChange={(event) => updateDraft({ period: event.target.value })}
                    placeholder="/ Month"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-gray-700 sm:col-span-2">
                  Description
                  <textarea
                    value={draft.description}
                    maxLength={240}
                    rows={3}
                    onChange={(event) =>
                      updateDraft({ description: event.target.value })
                    }
                    placeholder="Describe this offer or featured banner."
                    className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </label>
                <label className="space-y-2 text-sm font-semibold text-gray-700 sm:col-span-2">
                  Image URL
                  <input
                    type="url"
                    value={draft.image}
                    required
                    onChange={(event) => updateDraft({ image: event.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary">
                    <ImagePlus size={16} />
                    {uploadingId === draft.id ? "Uploading…" : "Upload image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingId !== null}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadImage(draft.id, file);
                        event.target.value = "";
                      }}
                      className="sr-only"
                    />
                  </label>
                  <span className="text-xs text-gray-500">
                    JPEG, PNG, or WebP · up to 8 MB
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeEditor}
                    disabled={uploadingId !== null}
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingId !== null}
                    className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {editingId ? "Update banner" : "Add banner"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/65 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPendingDelete(null);
          }}
        >
          <div
            ref={modalRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-banner-title"
            aria-describedby="delete-banner-description"
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="p-6 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 size={21} />
              </div>
              <h2
                id="delete-banner-title"
                className="mt-5 text-xl font-bold text-gray-900"
              >
                Delete this banner?
              </h2>
              <p
                id="delete-banner-description"
                className="mt-2 text-sm leading-6 text-gray-600"
              >
                You&apos;re about to remove{" "}
                <span className="font-bold text-gray-900">
                  {pendingDelete.car || "this banner"}
                </span>{" "}
                from the slideshow. This change won&apos;t appear on the
                homepage until you save and publish.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/80 p-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
              >
                Keep banner
              </button>
              <button
                type="button"
                onClick={confirmDeleteSlide}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                <Trash2 size={15} />
                Delete banner
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
