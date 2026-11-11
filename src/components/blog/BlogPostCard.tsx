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
      className={`group h-full overflow-hidden border shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isDark
          ? "border-white/10 bg-[#1a1b1a] hover:border-primary-light/50 hover:shadow-black/25"
          : "border-gray-200 bg-white hover:border-primary/30"
      } ${
        featured ? "grid md:grid-cols-[1.15fr_0.85fr]" : "flex flex-col"
      }`}
    >
      <Link
        href={`/blog/${post.slug}`}
        className={`relative block shrink-0 overflow-hidden ${
          isDark ? "bg-[#111]" : "bg-gray-100"
        } ${
          featured
            ? "aspect-[16/10] md:aspect-auto md:min-h-[390px]"
            : "aspect-[16/10]"
        }`}
        aria-label={`Read ${post.title}`}
      >
        {post.featured_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.featured_image}
            alt=""
            loading={featured ? "eager" : "lazy"}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className={`absolute inset-0 grid place-items-center bg-[radial-gradient(ellipse_at_75%_25%,rgba(76,175,80,0.28),transparent_35%),linear-gradient(135deg,#111827,#1f2937_55%,#14532d)] text-6xl font-extrabold tracking-tighter text-white/20 ${
              featured ? "md:text-8xl" : ""
            }`}
          >
            KASON
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-70 transition group-hover:opacity-100" />
        {post.category && (
          <span className="absolute left-4 top-4 border border-white/20 bg-black/45 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md">
            {post.category.name}
          </span>
        )}
        {featured && (
          <span className="absolute bottom-4 left-4 bg-primary px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
            Featured story
          </span>
        )}
      </Link>

      <div
        className={`flex min-w-0 flex-1 flex-col ${
          featured ? "justify-center p-6 sm:p-8 lg:p-10" : "p-5 sm:p-6"
        }`}
      >
        <div
          className={`mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold ${
            isDark ? "text-font/60" : "text-gray-500"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={14} className={isDark ? "text-primary-light" : "text-primary"} />
            {formatDate(post.published_at)}
          </span>
          {post.authorName && (
            <span className="truncate">By {post.authorName}</span>
          )}
        </div>

        <h2
          className={`font-bold leading-tight tracking-tight ${
            isDark ? "text-font" : "text-gray-900"
          } ${featured ? "text-2xl sm:text-3xl lg:text-4xl" : "text-lg sm:text-xl"}`}
        >
          <Link
            href={`/blog/${post.slug}`}
            className={`transition-colors ${
              isDark ? "group-hover:text-primary-light" : "group-hover:text-primary"
            }`}
          >
            {post.title}
          </Link>
        </h2>
        {post.excerpt && (
          <p
            className={`mt-3 leading-relaxed ${
              isDark ? "text-font/65" : "text-gray-600"
            } ${featured ? "line-clamp-4 text-sm sm:text-base" : "line-clamp-3 text-sm"}`}
          >
            {post.excerpt}
          </p>
        )}
        <Link
          href={`/blog/${post.slug}`}
          className={`mt-auto inline-flex w-fit items-center gap-2 pt-5 text-sm font-bold ${
            isDark ? "text-primary-light" : "text-primary"
          }`}
        >
          Read story
          <ArrowUpRight
            size={16}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
    </article>
  );
}
