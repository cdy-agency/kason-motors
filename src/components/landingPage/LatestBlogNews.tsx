import Link from "next/link";
import BlogPostCard from "@/components/blog/BlogPostCard";
import { getLatestPublicBlogPosts } from "@/lib/blog/public";

export default async function LatestBlogNews() {
  const posts = await getLatestPublicBlogPosts(3);
  if (posts.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-white/5 bg-[#171817] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_90%_0%,rgba(76,175,80,0.1),transparent_42%)]"
      />
      <div className="mx-auto max-w-7xl">
        <div className="relative mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-light sm:text-sm">
              <span className="h-px w-7 bg-primary-light" />
              The Kason Motors journal
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-font md:text-4xl">
              Latest news <span className="text-primary-light">&amp; insights</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-font/70">
              Discover showroom arrivals, automotive news, and practical advice from our team.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex shrink-0 items-center gap-2 border border-white/15 px-4 py-2.5 text-sm font-bold text-font/80 transition hover:border-primary-light hover:text-primary-light"
          >
            View all stories <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="relative grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} theme="dark" />
          ))}
        </div>
      </div>
    </section>
  );
}
