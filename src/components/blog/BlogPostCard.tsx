import Link from "next/link";
import { CalendarDays, ArrowUpRight } from "lucide-react";

import type { PublicBlogPost } from "@/lib/blog/public";

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-RW", { dateStyle: "medium" }).format(new Date(value))
    : "";

export default function BlogPostCard({
  post,
  featured = false,
  theme = "light",
}: {
  post: PublicBlogPost;
  featured?: boolean;
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";

  return (
    <article
      className={`group overflow-hidden rounded-2xl border shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        isDark
          ? "border-line/25 bg-gray-dark hover:border-primary/40"
          : "border-gray-200 bg-white"
      } ${
        featured ? "grid md:grid-cols-2" : ""
      }`}
    >
      <Link
        href={`/blog/${post.slug}`}
        className={`relative block overflow-hidden ${isDark ? "bg-ink" : "bg-gray-100"} ${
          featured ? "min-h-64 md:min-h-96" : "aspect-[16/10]"
        }`}
        aria-label={`Read ${post.title}`}
      >
        {post.featured_image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featured_image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </>
        ) : (
          <div className={`absolute inset-0 grid place-items-center text-5xl font-bold ${isDark ? "text-primary/40" : "text-primary/20"}`}>
            KM
          </div>
        )}
      </Link>

      <div className={`flex flex-col ${featured ? "justify-center p-7 md:p-10" : "p-5"}`}>
        <div className={`mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold ${isDark ? "text-font/70" : "text-gray-500"}`}>
          {post.category && (
            <Link
              href={`/blog?category=${encodeURIComponent(post.category.slug)}`}
              className={`rounded-full px-3 py-1 ${
                isDark
                  ? "bg-primary text-font hover:bg-primary-dark"
                  : "bg-primary/10 text-primary hover:bg-primary/15"
              }`}
            >
              {post.category.name}
            </Link>
          )}
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} />
            {formatDate(post.published_at)}
          </span>
        </div>

        <h2 className={`font-bold leading-tight ${isDark ? "text-font" : "text-gray-900"} ${featured ? "text-3xl md:text-4xl" : "text-xl"}`}>
          <Link href={`/blog/${post.slug}`} className={isDark ? "hover:text-primary-light" : "hover:text-primary"}>
            {post.title}
          </Link>
        </h2>
        {post.excerpt && (
          <p className={`mt-3 leading-relaxed ${isDark ? "text-font/70" : "text-gray-600"} ${featured ? "text-base md:text-lg" : "text-sm"}`}>
            {post.excerpt}
          </p>
        )}
        <Link
          href={`/blog/${post.slug}`}
          className={`mt-5 inline-flex w-fit items-center gap-2 text-sm font-bold ${isDark ? "text-primary-light" : "text-primary"}`}
        >
          Read article <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
