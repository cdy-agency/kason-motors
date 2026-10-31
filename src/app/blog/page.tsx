import type { Metadata } from "next";
import Link from "next/link";

import BlogPostCard from "@/components/blog/BlogPostCard";
import Footer from "@/components/landingPage/Footer";
import Navbar from "@/components/landingPage/Navbar";
import { getPublicBlogListing } from "@/lib/blog/public";

type PageProps = {
  searchParams: Promise<{ category?: string; page?: string }>;
};

const pageUrl = (page: number, categorySlug?: string) => {
  const search = new URLSearchParams();
  if (categorySlug) search.set("category", categorySlug);
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `/blog?${query}` : "/blog";
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { category } = await searchParams;
  return {
    title: category ? `${category} | Kason Motors News` : "Blog & News | Kason Motors",
    description:
      "Vehicle arrivals, automotive news, car reviews, buying guides, and updates from Kason Motors.",
    alternates: process.env.NEXT_PUBLIC_SITE_URL
      ? { canonical: new URL(pageUrl(1, category), process.env.NEXT_PUBLIC_SITE_URL) }
      : undefined,
    openGraph: {
      title: category ? `${category} | Kason Motors News` : "Blog & News | Kason Motors",
      description: "News, advice, and vehicle showcases from Kason Motors.",
      type: "website",
    },
  };
}

export default async function BlogListingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categorySlug = params.category;
  const requestedPage = Number(params.page);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, 100_000)
      : 1;
  const listing = await getPublicBlogListing(categorySlug, page);
  const featuredPost = listing.posts[0];
  const remainingPosts = listing.posts.slice(1);
  const pageCount = Math.ceil(listing.total / listing.pageSize);

  return (
    <main className="min-h-screen bg-bg text-font">
      <Navbar />
      <section className="relative overflow-hidden bg-gray-dark px-4 py-16 text-center sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(76,175,80,0.16),transparent_58%)]"
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary-light sm:text-sm">
            The Kason Motors journal
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-font sm:text-5xl md:text-6xl">
            Stories for the <span className="text-primary-light">road ahead</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-font/65 sm:text-base">
            Showroom arrivals, automotive news, practical advice, and the latest
            from our team.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <nav
          aria-label="Filter articles by category"
          className="mb-9 flex gap-2 overflow-x-auto pb-2"
        >
          <Link
            href="/blog"
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              !categorySlug
                ? "border-primary bg-primary text-font"
                : "border-line/30 bg-gray-dark text-font/70 hover:border-primary-light hover:text-primary-light"
            }`}
          >
            All stories
          </Link>
          {listing.categories.map((category) => (
            <Link
              key={category.id}
              href={pageUrl(1, category.slug)}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                categorySlug === category.slug
                  ? "border-primary bg-primary text-font"
                  : "border-line/30 bg-gray-dark text-font/70 hover:border-primary-light hover:text-primary-light"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </nav>

        {categorySlug && !listing.category ? (
          <p className="rounded-2xl border border-line/25 bg-gray-dark px-6 py-12 text-center text-font/70">
            This category does not exist or has no published stories.
          </p>
        ) : featuredPost ? (
          <>
            <div className="mb-10">
              <BlogPostCard post={featuredPost} featured theme="dark" />
            </div>
            {remainingPosts.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {remainingPosts.map((post) => (
                  <BlogPostCard key={post.id} post={post} theme="dark" />
                ))}
              </div>
            )}
            {pageCount > 1 && (
              <nav
                aria-label="Blog pages"
                className="mt-10 flex items-center justify-center gap-3"
              >
                {page > 1 && (
                  <Link
                    href={pageUrl(page - 1, categorySlug)}
                    className="rounded-lg border border-line/30 bg-gray-dark px-4 py-2 text-sm font-semibold text-font/75 transition hover:border-primary-light hover:text-primary-light"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-sm text-font/60">
                  Page {page} of {pageCount}
                </span>
                {page < pageCount && (
                  <Link
                    href={pageUrl(page + 1, categorySlug)}
                    className="rounded-lg border border-line/30 bg-gray-dark px-4 py-2 text-sm font-semibold text-font/75 transition hover:border-primary-light hover:text-primary-light"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-line/25 bg-gray-dark px-6 py-16 text-center">
            <h2 className="text-xl font-bold text-font">No stories yet</h2>
            <p className="mt-2 text-sm text-font/65">
              Check back soon for news and updates from Kason Motors.
            </p>
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
