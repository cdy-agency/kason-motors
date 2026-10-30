import Link from "next/link";
import BlogPostCard from "@/components/blog/BlogPostCard";
import { getLatestPublicBlogPosts } from "@/lib/blog/public";

export default async function LatestBlogNews() {
  const posts = await getLatestPublicBlogPosts(3);
  if (posts.length === 0) return null;

  return (
    <section className="bg-bg px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-widest text-font">
              From the Kason Motors journal
            </p>
            <h2 className="text-3xl font-bold text-primary-light md:text-4xl">
              Latest news &amp; insights
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-font/70">
              Discover showroom arrivals, automotive news, and practical advice from our team.
            </p>
          </div>
          <Link
            href="/blog"
            className="hidden shrink-0 text-sm font-semibold text-font hover:underline sm:block"
          >
            View All Articles →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} theme="dark" />
          ))}
        </div>
      </div>
    </section>
  );
}
