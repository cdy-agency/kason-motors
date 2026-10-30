"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Trash2, Pencil, FolderOpen } from "lucide-react";

import type { Database } from "@/types/database";

type Category = Database["public"]["Tables"]["blog_categories"]["Row"];
type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"] & {
  category: Category | null;
  tags: string[];
};
type PostsResponse = {
  posts: BlogPost[];
  categories: Category[];
  total: number;
  page: number;
  pageSize: number;
};

const statusNames: Record<BlogPost["status"], string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-RW", { dateStyle: "medium" }).format(new Date(value));

export default function BlogPostsManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({ page: String(page) });
    if (searchTerm) params.set("search", searchTerm);
    if (status) params.set("status", status);
    if (categoryId) params.set("categoryId", categoryId);

    try {
      const response = await fetch(`/api/admin/blog/posts?${params.toString()}`);
      const result = (await response.json()) as PostsResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || "Failed to load articles.");
      setPosts(result.posts);
      setCategories(result.categories);
      setTotal(result.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load articles.");
    } finally {
      setLoading(false);
    }
  }, [categoryId, page, searchTerm, status]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const deletePost = async (post: BlogPost) => {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setDeletingId(post.id);
    setError("");

    try {
      const response = await fetch(`/api/admin/blog/posts/${post.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Failed to delete article.");
      await loadPosts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Failed to delete article.");
    } finally {
      setDeletingId(null);
    }
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchTerm(search.trim());
  };

  const pageCount = Math.max(1, Math.ceil(total / 20));

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog &amp; News</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage showroom stories, automotive news, and guides.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/blog/categories"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary"
          >
            <FolderOpen size={16} /> Categories &amp; tags
          </Link>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            <Plus size={17} /> New article
          </Link>
        </div>
      </header>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2">
            <label htmlFor="blog-search" className="sr-only">
              Search article titles
            </label>
            <input
              id="blog-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search article titles..."
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus:border-primary"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
            >
              <Search size={16} /> Search
            </button>
          </form>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="sr-only">Filter by category</span>
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-primary"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="sr-only">Filter by status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-primary"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-gray-500">Loading articles…</p>
        ) : posts.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <h2 className="font-bold text-gray-900">No articles found</h2>
            <p className="mt-1 text-sm text-gray-500">
              Create an article or adjust your search and filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Article</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Updated</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{post.title}</p>
                      <p className="mt-1 max-w-md truncate text-xs text-gray-500">
                        /blog/{post.slug}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{post.category?.name ?? "—"}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                          post.status === "PUBLISHED"
                            ? "bg-green-50 text-green-700"
                            : post.status === "ARCHIVED"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {statusNames[post.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(post.updated_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {post.status === "PUBLISHED" && (
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-primary"
                          >
                            Preview
                          </Link>
                        )}
                        <Link
                          href={`/admin/blog/${post.id}`}
                          aria-label={`Edit ${post.title}`}
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:text-primary"
                        >
                          <Pencil size={15} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => void deletePost(post)}
                          disabled={deletingId === post.id}
                          aria-label={`Delete ${post.title}`}
                          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && total > 20 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 py-2">
              {page} / {pageCount}
            </span>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
