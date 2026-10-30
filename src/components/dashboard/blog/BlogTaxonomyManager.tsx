"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  FolderOpen,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";

import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["blog_categories"]["Row"];
type Tag = Database["public"]["Tables"]["blog_tags"]["Row"];
type TaxonomyItem = Category | Tag;

export default function BlogTaxonomyManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [tagName, setTagName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTaxonomy = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryResponse, tagResponse] = await Promise.all([
        fetch("/api/admin/blog/categories"),
        fetch("/api/admin/blog/tags"),
      ]);
      const [categoryData, tagData] = (await Promise.all([
        categoryResponse.json(),
        tagResponse.json(),
      ])) as [
        { categories?: Category[]; error?: string },
        { tags?: Tag[]; error?: string },
      ];

      if (!categoryResponse.ok || !tagResponse.ok) {
        throw new Error(
          categoryData.error || tagData.error || "Failed to load categories and tags.",
        );
      }

      setCategories(categoryData.categories ?? []);
      setTags(tagData.tags ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load categories and tags.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTaxonomy();
  }, [loadTaxonomy]);

  const saveItem = async (
    type: "categories" | "tags",
    item: TaxonomyItem | null,
    name: string,
    description?: string,
  ) => {
    if (!name.trim()) {
      setError(`Enter a ${type === "categories" ? "category" : "tag"} name.`);
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        item ? `/api/admin/blog/${type}/${item.id}` : `/api/admin/blog/${type}`,
        {
          method: item ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            ...(type === "categories" ? { description: description || null } : {}),
          }),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Failed to save.");

      setCategoryName("");
      setCategoryDescription("");
      setTagName("");
      setEditingCategory(null);
      setEditingTag(null);
      setNotice(`${type === "categories" ? "Category" : "Tag"} saved.`);
      await loadTaxonomy();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save.");
    } finally {
      setBusy(false);
    }
  };

  const deleteItem = async (type: "categories" | "tags", item: TaxonomyItem) => {
    const label = type === "categories" ? "category" : "tag";
    const message =
      type === "categories"
        ? `Delete category “${item.name}”? Articles will no longer be assigned to it.`
        : `Delete tag “${item.name}” and remove it from articles?`;
    if (!window.confirm(message)) return;

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/blog/${type}/${item.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || `Failed to delete ${label}.`);
      setNotice(`${label[0].toUpperCase()}${label.slice(1)} deleted.`);
      await loadTaxonomy();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : `Failed to delete ${label}.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blog"
            aria-label="Back to articles"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-primary hover:text-primary"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Categories &amp; tags
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Organize your blog articles.
            </p>
          </div>
        </div>
        <Link href="/admin/blog" className="text-sm font-semibold text-primary hover:underline">
          View articles
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700"
        >
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
            !
          </span>
          <p>{error}</p>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-sm font-medium text-green-800"
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
            <Check size={13} />
          </span>
          {notice}
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5">
            <FolderOpen size={17} className="text-primary" />
            <h2 className="text-sm font-bold text-gray-900">Categories</h2>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveItem(
                "categories",
                editingCategory,
                categoryName,
                categoryDescription,
              );
            }}
            className="space-y-3 border-b border-gray-100 bg-gray-50/70 p-4"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-700">
                Category name <span className="text-primary">*</span>
              </span>
              <input
                value={categoryName}
                maxLength={80}
                onChange={(event) => setCategoryName(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="e.g. Buying Guides"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-700">
                Description <span className="font-normal text-gray-400">(optional)</span>
              </span>
              <textarea
                value={categoryDescription}
                maxLength={300}
                rows={2}
                onChange={(event) => setCategoryDescription(event.target.value)}
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/10"
                placeholder="Optional description"
              />
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={busy || !categoryName.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingCategory ? <Pencil size={15} /> : <Plus size={16} />}
                {editingCategory ? "Save changes" : "Create category"}
              </button>
              {editingCategory && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName("");
                    setCategoryDescription("");
                    setError("");
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="p-3 sm:p-4">
            {loading ? (
              <div className="space-y-2 p-2" aria-label="Loading categories">
                <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-10 animate-pulse rounded-lg bg-gray-100" />
              </div>
            ) : categories.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500">
                No categories yet. Add one above.
              </div>
            ) : (
              <ul className="space-y-1">
                {categories.map((category) => (
                  <li
                    key={category.id}
                    className={`group flex items-start justify-between gap-3 rounded-lg px-2.5 py-2 transition ${
                      editingCategory?.id === category.id
                        ? "bg-primary/5 ring-1 ring-primary/15"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {category.name}
                        </p>
                        {category.description && (
                          <p className="mt-0.5 truncate text-xs text-gray-500">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-100 transition sm:opacity-60 sm:group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(category);
                          setCategoryName(category.name);
                          setCategoryDescription(category.description ?? "");
                          setError("");
                        }}
                        aria-label={`Edit ${category.name}`}
                        title="Edit category"
                        className="rounded-lg border border-transparent p-2 text-gray-500 transition hover:border-gray-200 hover:bg-white hover:text-primary"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void deleteItem("categories", category)}
                        aria-label={`Delete ${category.name}`}
                        title="Delete category"
                        className="rounded-lg border border-transparent p-2 text-gray-500 transition hover:border-red-100 hover:bg-white hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3.5">
            <Tag size={17} className="text-violet-700" />
            <h2 className="text-sm font-bold text-gray-900">Tags</h2>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void saveItem("tags", editingTag, tagName);
            }}
            className="space-y-3 border-b border-gray-100 bg-gray-50/70 p-4"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-700">
                Tag name <span className="text-primary">*</span>
              </span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative min-w-0 flex-1">
                  <Tag
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={tagName}
                    maxLength={80}
                    onChange={(event) => setTagName(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="e.g. Electric Cars"
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || !tagName.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingTag ? <Pencil size={15} /> : <Plus size={16} />}
                  {editingTag ? "Save tag" : "Add tag"}
                </button>
              </div>
            </label>
            {editingTag && (
              <button
                type="button"
                onClick={() => {
                  setEditingTag(null);
                  setTagName("");
                  setError("");
                }}
                className="text-xs font-semibold text-gray-500 transition hover:text-gray-800"
              >
                Cancel editing
              </button>
            )}
          </form>

          <div className="p-3 sm:p-4">
            {loading ? (
              <div className="flex flex-wrap gap-2 p-2" aria-label="Loading tags">
                <div className="h-8 w-28 animate-pulse rounded-full bg-gray-100" />
                <div className="h-8 w-36 animate-pulse rounded-full bg-gray-100" />
                <div className="h-8 w-24 animate-pulse rounded-full bg-gray-100" />
              </div>
            ) : tags.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-gray-500">
                No tags yet. Add one above.
              </div>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li
                    key={tag.id}
                    className={`group inline-flex max-w-full items-center gap-1 rounded-full border py-1 pl-3 pr-1 transition ${
                      editingTag?.id === tag.id
                        ? "border-violet-200 bg-violet-50"
                        : "border-gray-200 bg-white hover:border-violet-200 hover:bg-violet-50/50"
                    }`}
                  >
                    <span className="truncate text-sm font-medium text-gray-700">{tag.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTag(tag);
                        setTagName(tag.name);
                        setError("");
                      }}
                      aria-label={`Edit ${tag.name}`}
                      title="Edit tag"
                      className="rounded-full p-1.5 text-gray-400 transition hover:bg-white hover:text-primary"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void deleteItem("tags", tag)}
                      aria-label={`Delete ${tag.name}`}
                      title="Delete tag"
                      className="rounded-full p-1.5 text-gray-400 transition hover:bg-white hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

    </section>
  );
}
