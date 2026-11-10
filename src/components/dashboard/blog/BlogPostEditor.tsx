"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  CarFront,
  ChevronDown,
  Eye,
  ImagePlus,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Send,
  X,
} from "lucide-react";

import BlogArticlePreview from "@/components/dashboard/blog/BlogArticlePreview";
import BlogRichTextEditor from "@/components/dashboard/blog/BlogRichTextEditor";
import { Select } from "@/components/ui/Select";
import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["blog_categories"]["Row"];
type Tag = Database["public"]["Tables"]["blog_tags"]["Row"];
type Post = Database["public"]["Tables"]["blog_posts"]["Row"];

type VehicleOption = {
  id: number;
  name: string | null;
  year: number | null;
  category: string | null;
};

type FormValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  status: Post["status"] | "";
  categoryId: string;
  vehicleId: string;
};

type Props = {
  postId: string;
  isNew: boolean;
  authorName?: string;
};

const emptyValues: FormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  status: "",
  categoryId: "",
  vehicleId: "",
};

const isVehicleOption = (value: unknown): value is VehicleOption => {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "number" &&
    (typeof record.name === "string" || record.name === null) &&
    (typeof record.year === "number" || record.year === null) &&
    (typeof record.category === "string" || record.category === null)
  );
};

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");

const responseError = (body: { error?: string }, fallback: string) =>
  body.error || fallback;

export default function BlogPostEditor({ postId, isNew, authorName }: Props) {
  const router = useRouter();
  const galleryInput = useRef<HTMLInputElement>(null);
  const vehiclePickerRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [vehicleError, setVehicleError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contentImagesUploading, setContentImagesUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [slugManual, setSlugManual] = useState(false);
  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [highlightedVehicleIndex, setHighlightedVehicleIndex] = useState(0);

  const selectedVehicle =
    vehicles.find((vehicle) => String(vehicle.id) === values.vehicleId) ?? null;
  const vehicleLabel = (vehicle: VehicleOption) =>
    [vehicle.name, vehicle.year, vehicle.category].filter(Boolean).join(" · ") ||
    `Vehicle ${vehicle.id}`;
  const filteredVehicles = vehicles.filter((vehicle) =>
    vehicleLabel(vehicle).toLowerCase().includes(vehicleSearch.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!vehiclePickerOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !vehiclePickerRef.current?.contains(event.target)
      ) {
        setVehiclePickerOpen(false);
        setVehicleSearch("");
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [vehiclePickerOpen]);

  useEffect(() => {
    let active = true;

    const loadForm = async () => {
      setLoading(true);
      setError("");

      try {
        const [categoryResponse, tagResponse, vehicleResponse] = await Promise.all([
          fetch("/api/admin/blog/categories"),
          fetch("/api/admin/blog/tags"),
          fetch("/api/vehicles/getList"),
        ]);
        const [categoryData, tagData] = (await Promise.all([
          categoryResponse.json(),
          tagResponse.json(),
        ])) as [
          { categories?: Category[]; error?: string },
          { tags?: Tag[]; error?: string },
        ];

        if (!categoryResponse.ok) {
          throw new Error(responseError(categoryData, "Could not load categories."));
        }
        if (!tagResponse.ok) {
          throw new Error(responseError(tagData, "Could not load tags."));
        }

        let nextValues = { ...emptyValues };
        let nextTagIds: string[] = [];

        if (!isNew) {
          const postResponse = await fetch(`/api/admin/blog/posts/${postId}`);
          const postData = (await postResponse.json()) as {
            post?: Post;
            tagIds?: string[];
            categories?: Category[];
            tags?: Tag[];
            galleryImages?: string[];
            error?: string;
          };

          if (!postResponse.ok || !postData.post) {
            throw new Error(responseError(postData, "Could not load this article."));
          }

          const post = postData.post;
          nextValues = {
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt ?? "",
            content: post.content,
            featuredImage: post.featured_image ?? "",
            status: post.status,
            categoryId: post.category_id ?? "",
            vehicleId: post.vehicle_id ? String(post.vehicle_id) : "",
          };
          nextTagIds = postData.tagIds ?? [];
          if (active) {
            setGalleryImages(postData.galleryImages ?? [
              ...(post.featured_image ? [post.featured_image] : []),
            ]);
          }
        }

        let nextVehicles: VehicleOption[] = [];
        let nextVehicleError = "";
        try {
          if (!vehicleResponse.ok) throw new Error("Could not load the vehicle inventory.");
          const vehicleData = (await vehicleResponse.json()) as { data?: unknown };
          nextVehicles = Array.isArray(vehicleData.data)
            ? vehicleData.data.filter(isVehicleOption)
            : [];
        } catch (loadVehicleError) {
          nextVehicleError =
            loadVehicleError instanceof Error
              ? loadVehicleError.message
              : "Could not load the vehicle inventory.";
        }

        if (active) {
          setCategories(categoryData.categories ?? []);
          setTags(tagData.tags ?? []);
          setVehicles(nextVehicles);
          setVehicleError(nextVehicleError);
          setValues(nextValues);
          setSelectedTagIds(nextTagIds);
          setSlugManual(!isNew);
          if (isNew) setGalleryImages([]);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load the editor.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadForm();
    return () => {
      active = false;
    };
  }, [isNew, postId]);

  const updateValue = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const selectVehicle = (vehicle: VehicleOption | null) => {
    updateValue("vehicleId", vehicle ? String(vehicle.id) : "");
    setVehiclePickerOpen(false);
    setVehicleSearch("");
    setHighlightedVehicleIndex(0);
  };

  const handleVehiclePickerKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setVehiclePickerOpen(false);
      setVehicleSearch("");
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!vehiclePickerOpen) {
        setVehiclePickerOpen(true);
        setHighlightedVehicleIndex(0);
        return;
      }
      setVehiclePickerOpen(true);
      setHighlightedVehicleIndex((current) =>
        filteredVehicles.length > 0
          ? Math.min(current + 1, filteredVehicles.length - 1)
          : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setVehiclePickerOpen(true);
      setHighlightedVehicleIndex((current) => Math.max(0, current - 1));
      return;
    }

    if (event.key === "Enter" && vehiclePickerOpen) {
      event.preventDefault();
      const vehicle = filteredVehicles[highlightedVehicleIndex];
      if (vehicle) selectVehicle(vehicle);
    }
  };

  const uploadGalleryImages = async (files: File[]) => {
    if (files.length === 0) return;
    const remainingSlots = 50 - galleryImages.length;
    const filesToUpload = files.slice(0, remainingSlots);
    const uploadErrors = filesToUpload
      .filter((file) => file.size > 8 * 1024 * 1024)
      .map((file) => `${file.name}: images must be smaller than 8 MB.`);
    const validFiles = filesToUpload.filter((file) => file.size <= 8 * 1024 * 1024);
    if (filesToUpload.length < files.length) uploadErrors.push("An article can have up to 50 images.");
    setError("");

    if (validFiles.length === 0) {
      if (uploadErrors.length > 0) setError(uploadErrors.slice(0, 3).join(" "));
      return;
    }

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of validFiles) {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("postId", postId);

        try {
          const response = await fetch("/api/admin/blog/media", {
            method: "POST",
            body: formData,
          });
          const result = (await response.json()) as { imageUrl?: string; error?: string };
          if (!response.ok || !result.imageUrl) {
            throw new Error(result.error || "Failed to upload image.");
          }
          uploadedUrls.push(result.imageUrl);
        } catch (uploadError) {
          uploadErrors.push(
            `${file.name}: ${uploadError instanceof Error ? uploadError.message : "Upload failed."}`,
          );
        }
      }

      if (uploadedUrls.length > 0) {
        setGalleryImages((current) => [...new Set([...current, ...uploadedUrls])]);
        if (!values.featuredImage) updateValue("featuredImage", uploadedUrls[0]);
      }

      if (uploadErrors.length > 0) {
        setError(uploadErrors.slice(0, 3).join(" "));
      } else if (uploadedUrls.length > 0 && filesToUpload.length === files.length) {
        setError("");
      }
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (imageUrl: string) => {
    const nextImages = galleryImages.filter((url) => url !== imageUrl);
    setGalleryImages(nextImages);
    if (values.featuredImage === imageUrl) {
      updateValue("featuredImage", nextImages[0] ?? "");
    }
  };

  const savePost = async () => {
    if (!values.title.trim()) {
      setError("Enter an article title.");
      return;
    }
    if (!values.status) {
      setError("Choose a status before saving.");
      return;
    }
    if (values.status === "PUBLISHED" && !values.categoryId) {
      setError("Choose a category before saving.");
      return;
    }
    if (values.status === "PUBLISHED" && !values.content.trim()) {
      setError("Write the article content before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const body = {
      id: postId,
      title: values.title,
      slug: values.slug || slugify(values.title),
      excerpt: values.excerpt || null,
      content: values.content,
      featuredImage: values.featuredImage || null,
      galleryImages,
      status: values.status,
      categoryId: values.categoryId || null,
      vehicleId: values.vehicleId ? Number(values.vehicleId) : null,
      tagIds: selectedTagIds,
    };

    try {
      const response = await fetch(
        isNew ? "/api/admin/blog/posts" : `/api/admin/blog/posts/${postId}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Failed to save article.");

      if (isNew) {
        router.push(`/admin/blog/${postId}`);
        router.refresh();
      } else {
        setNotice("Article saved successfully.");
        router.refresh();
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save article.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="py-16 text-center text-sm text-gray-500">Loading article editor…</p>;
  }

  if (error && categories.length === 0 && !isNew) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">
        {error}
        <div className="mt-4">
          <Link href="/admin/blog" className="font-bold underline">Back to articles</Link>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/blog" className="text-sm font-semibold text-primary hover:underline">
            ← All articles
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {isNew ? "Create article" : "Edit article"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {authorName ? `Author: ${authorName}` : "Write, preview, and publish a story."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPreviewing((current) => !current)}
            disabled={contentImagesUploading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
          >
            {previewing ? <X size={16} /> : <Eye size={16} />}
            {previewing ? "Return to editor" : "Preview"}
          </button>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </p>
      )}

      {previewing ? (
        <BlogArticlePreview
          title={values.title}
          excerpt={values.excerpt}
          content={values.content}
          featuredImage={values.featuredImage}
          galleryImages={galleryImages}
        />
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-5">
              <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">Title *</span>
                  <input
                    value={values.title}
                    maxLength={160}
                    onChange={(event) => {
                      const title = event.target.value;
                      setValues((current) => ({
                        ...current,
                        title,
                        slug: slugManual ? current.slug : slugify(title),
                      }));
                    }}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-3 text-lg font-semibold text-gray-900 outline-none placeholder:text-gray-500 focus:border-primary"
                    placeholder="Give your article a clear title"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
                    URL slug
                    <button
                      type="button"
                      onClick={() => {
                        if (slugManual) {
                          updateValue("slug", slugify(values.title));
                          setSlugManual(false);
                        } else {
                          setSlugManual(true);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark"
                    >
                      {slugManual ? <RotateCcw size={13} /> : <Pencil size={13} />}
                      {slugManual ? "Use title" : "Edit"}
                    </button>
                  </span>
                  <div
                    className={`flex items-center rounded-lg border px-3 transition focus-within:border-primary ${
                      slugManual ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
                    }`}
                  >
                    <span className="shrink-0 text-sm text-gray-400">/blog/</span>
                    <input
                      value={values.slug}
                      maxLength={120}
                      onChange={(event) => {
                        updateValue("slug", slugify(event.target.value));
                      }}
                      readOnly={!slugManual}
                      className="min-w-0 flex-1 border-0 bg-transparent px-1 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-500 read-only:cursor-default"
                      placeholder="Generated from article title"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">
                    {slugManual
                      ? "Custom slug. Use lowercase letters, numbers, and hyphens."
                      : "Generated automatically from the article title."}
                  </p>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-gray-700">Excerpt</span>
                  <textarea
                    value={values.excerpt}
                    maxLength={400}
                    rows={3}
                    onChange={(event) => updateValue("excerpt", event.target.value)}
                    className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-primary"
                    placeholder="A short introduction shown on article cards"
                  />
                  <span className="mt-1 block text-right text-xs text-gray-400">
                    {values.excerpt.length}/400
                  </span>
                </label>
              </section>

              <section className="space-y-2 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">Article content</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Drafts can be incomplete. Published stories need article text and a category.
                  </p>
                </div>
                <BlogRichTextEditor
                  key={postId}
                  postId={postId}
                  content={values.content}
                  onChange={(content) => updateValue("content", content)}
                  onUploadingChange={setContentImagesUploading}
                />
              </section>
            </div>

            <aside className="space-y-5">
              <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-gray-900">Publishing</h2>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </span>
                  <Select
                    ariaLabel="Article status"
                    value={values.status}
                    onValueChange={(value) => {
                      if (
                        value === "DRAFT" ||
                        value === "PUBLISHED" ||
                        value === "ARCHIVED"
                      ) {
                        updateValue("status", value);
                      }
                    }}
                    placeholder="Choose a status"
                    options={[
                      { value: "DRAFT", label: "Draft" },
                      { value: "PUBLISHED", label: "Published" },
                      { value: "ARCHIVED", label: "Archived" },
                    ]}
                    variant="light"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Category
                  </span>
                  <Select
                    ariaLabel="Article category"
                    value={values.categoryId}
                    onValueChange={(value) => updateValue("categoryId", value)}
                    placeholder="Choose a category"
                    options={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                    variant="light"
                  />
                  {categories.length === 0 && (
                    <Link href="/admin/blog/categories" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                      Add a category first
                    </Link>
                  )}
                </label>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Tags</p>
                  {tags.length === 0 ? (
                    <Link href="/admin/blog/categories" className="text-xs font-semibold text-primary hover:underline">
                      Create tags
                    </Link>
                  ) : (
                    <div className="max-h-40 space-y-2 overflow-y-auto">
                      {tags.map((tag) => (
                        <label key={tag.id} className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={selectedTagIds.includes(tag.id)}
                            onChange={(event) => {
                              setSelectedTagIds((current) =>
                                event.target.checked
                                  ? [...current, tag.id]
                                  : current.filter((id) => id !== tag.id),
                              );
                            }}
                            className="accent-primary"
                          />
                          {tag.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-gray-900">Article images</h2>
                    <p className="mt-1 text-xs text-gray-500">Choose one image as the cover.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => galleryInput.current?.click()}
                    disabled={uploading}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-primary hover:border-primary disabled:opacity-50"
                  >
                    <ImagePlus size={15} /> {uploading ? "Uploading…" : "Add images"}
                  </button>
                  <input
                    ref={galleryInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(event.target.files ?? []);
                      event.target.value = "";
                      if (files.length > 0) void uploadGalleryImages(files);
                    }}
                  />
                </div>
                {galleryImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {galleryImages.map((imageUrl, index) => {
                      const isCover = values.featuredImage === imageUrl;
                      return (
                        <div
                          key={imageUrl}
                          className={`relative overflow-hidden rounded-xl border ${
                            isCover ? "border-primary ring-2 ring-primary/20" : "border-gray-200"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt={`Article image ${index + 1}`}
                            className="h-28 w-full bg-gray-50 object-cover"
                          />
                          {isCover ? (
                            <span className="absolute left-2 top-2 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white shadow">
                              Cover
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateValue("featuredImage", imageUrl)}
                              className="absolute bottom-2 left-2 rounded-md bg-white/95 px-2 py-1 text-[10px] font-semibold text-gray-700 shadow hover:text-primary"
                            >
                              Set as cover
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(imageUrl)}
                            aria-label={`Remove article image ${index + 1}`}
                            className="absolute right-2 top-2 rounded-full bg-white/95 p-1 text-gray-700 shadow hover:text-red-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => galleryInput.current?.click()}
                    disabled={uploading}
                    className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary hover:text-primary disabled:opacity-50"
                  >
                    <ImagePlus size={22} /> Upload article images
                  </button>
                )}
                <p className="text-xs text-gray-400">
                  JPEG, PNG, WebP or GIF · up to 8 MB each · maximum 50 images
                </p>
              </section>

              <section className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="font-bold text-gray-900">Related vehicle</h2>
                <div ref={vehiclePickerRef} className="relative">
                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      role="combobox"
                      aria-label="Search related vehicles"
                      aria-autocomplete="list"
                      aria-expanded={vehiclePickerOpen}
                      aria-controls="related-vehicle-options"
                      aria-activedescendant={
                        vehiclePickerOpen && filteredVehicles[highlightedVehicleIndex]
                          ? `related-vehicle-${filteredVehicles[highlightedVehicleIndex].id}`
                          : undefined
                      }
                      value={
                        vehiclePickerOpen
                          ? vehicleSearch
                          : selectedVehicle
                            ? vehicleLabel(selectedVehicle)
                            : ""
                      }
                      onFocus={() => {
                        setVehiclePickerOpen(true);
                        setVehicleSearch("");
                        setHighlightedVehicleIndex(0);
                      }}
                      onClick={() => {
                        if (!vehiclePickerOpen) {
                          setVehiclePickerOpen(true);
                          setVehicleSearch("");
                          setHighlightedVehicleIndex(0);
                        }
                      }}
                      onChange={(event) => {
                        setVehicleSearch(event.target.value);
                        setHighlightedVehicleIndex(0);
                        setVehiclePickerOpen(true);
                      }}
                      onKeyDown={handleVehiclePickerKeyDown}
                      placeholder="Search vehicles by name, year, or make"
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <ChevronDown
                      size={16}
                      className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition ${
                        vehiclePickerOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {vehiclePickerOpen && (
                    <ul
                      id="related-vehicle-options"
                      role="listbox"
                      aria-label="Available vehicles"
                      className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
                    >
                      <li>
                        <button
                          type="button"
                          role="option"
                          aria-selected={!values.vehicleId}
                          onClick={() => selectVehicle(null)}
                          className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                            !values.vehicleId
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          No vehicle linked
                        </button>
                      </li>
                      {filteredVehicles.map((vehicle, index) => (
                        <li key={vehicle.id}>
                          <button
                            id={`related-vehicle-${vehicle.id}`}
                            type="button"
                            role="option"
                            aria-selected={values.vehicleId === String(vehicle.id)}
                            onMouseEnter={() => setHighlightedVehicleIndex(index)}
                            onClick={() => selectVehicle(vehicle)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                              values.vehicleId === String(vehicle.id)
                                ? "bg-primary/10 font-semibold text-primary"
                                : index === highlightedVehicleIndex
                                  ? "bg-gray-100 text-gray-900"
                                  : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <CarFront size={17} className="shrink-0 text-gray-400" />
                            <span className="truncate">{vehicleLabel(vehicle)}</span>
                          </button>
                        </li>
                      ))}
                      {filteredVehicles.length === 0 && (
                        <li className="px-3 py-3 text-sm text-gray-500">
                          {vehicles.length === 0
                            ? "No vehicles are available in the inventory."
                            : "No vehicles match your search."}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                {vehicleError && (
                  <p role="alert" className="text-xs text-amber-700">{vehicleError}</p>
                )}
                <p className="text-xs leading-relaxed text-gray-400">
                  Vehicle details and the inventory link are shown automatically on the published article.
                </p>
              </section>
            </aside>
          </div>
        </>
      )}
      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-5">
        <Link
          href="/admin/blog"
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={() => void savePost()}
          disabled={saving || uploading || contentImagesUploading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {values.status === "PUBLISHED" ? <Send size={16} /> : <Save size={16} />}
          {saving ? "Saving…" : values.status === "PUBLISHED" ? "Save & publish" : "Save article"}
        </button>
      </div>
    </section>
  );
}
