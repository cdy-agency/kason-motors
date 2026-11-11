import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

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
      <section className="relative isolate flex min-h-[420px] items-center overflow-hidden border-b border-white/10 bg-[#171817] px-4 py-16 sm:min-h-[500px] sm:px-6 sm:py-20 lg:min-h-[560px] lg:px-8">
        {featuredPost?.featured_image && (
          <Image
            src={featuredPost.featured_image}
            alt=""
            fill
            priority
            unoptimized
            sizes="100vw"
            className="-z-30 object-cover"
          />
        )}
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_15%_0%,rgba(76,175,80,0.2),transparent_45%),radial-gradient(ellipse_at_90%_100%,rgba(76,175,80,0.08),transparent_40%)]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/70 to-black/35" />
        <div className="relative mx-auto grid w-full max-w-7xl items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-primary-light sm:text-sm">
              <span className="h-px w-8 bg-primary-light" />
              The Kason Motors journal
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-font sm:text-5xl md:text-6xl">
              Stories for the
              <span className="block text-primary-light">road ahead.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-font/80 sm:text-base">
              Showroom arrivals, automotive news, practical advice, and the latest
              from our team.
            </p>
            {featuredPost && (
              <Link
                href={`/blog/${featuredPost.slug}`}
                className="mt-7 inline-flex items-center gap-3 border border-white/30 bg-black/25 px-4 py-3 text-left backdrop-blur-sm transition hover:border-primary-light"
              >
                <span className="h-9 w-1 shrink-0 bg-primary-light" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-primary-light">
                    Featured story
                  </span>
                  <span className="mt-0.5 block max-w-md truncate text-sm font-bold text-white sm:text-base">
                    {featuredPost.title}
                  </span>
                </span>
              </Link>
            )}
          </div>
          {listing.total > 0 && (
            <div className="hidden border border-white/20 bg-black/25 px-6 py-5 text-right backdrop-blur-sm lg:block">
              <p className="text-3xl font-bold text-font">{listing.total}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-font/70">
                Published stories
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav
          aria-label="Filter articles by category"
          className="mb-10 flex gap-2 overflow-x-auto pb-2"
        >
          <Link
            href="/blog"
            className={`shrink-0 border px-4 py-2 text-sm font-semibold transition ${
              !categorySlug
                ? "border-primary bg-primary text-font"
                : "border-white/10 bg-white/[0.04] text-font/65 hover:border-primary-light/60 hover:bg-white/[0.08] hover:text-font"
            }`}
          >
            All stories
          </Link>
          {listing.categories.map((category) => (
            <Link
              key={category.id}
              href={pageUrl(1, category.slug)}
              className={`shrink-0 border px-4 py-2 text-sm font-semibold transition ${
                categorySlug === category.slug
                  ? "border-primary bg-primary text-font"
                  : "border-white/10 bg-white/[0.04] text-font/65 hover:border-primary-light/60 hover:bg-white/[0.08] hover:text-font"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </nav>

        {categorySlug && !listing.category ? (
          <p className="border border-white/10 bg-white/[0.04] px-6 py-12 text-center text-font/70">
            This category does not exist or has no published stories.
          </p>
        ) : featuredPost ? (
          <>
            <div className="mb-10">
              <BlogPostCard post={featuredPost} featured theme="dark" />
            </div>
            {remainingPosts.length > 0 && (
              <div>
                <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-3">
                  <h2 className="text-lg font-bold text-font">More stories</h2>
                  <span className="text-xs font-semibold uppercase tracking-wider text-font/45">
                    {listing.total} articles
                  </span>
                </div>
                <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {remainingPosts.map((post) => (
                  <BlogPostCard key={post.id} post={post} theme="dark" />
                ))}
                </div>
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
                    className="border border-line/30 bg-gray-dark px-4 py-2 text-sm font-semibold text-font/75 transition hover:border-primary-light hover:text-primary-light"
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
                    className="border border-line/30 bg-gray-dark px-4 py-2 text-sm font-semibold text-font/75 transition hover:border-primary-light hover:text-primary-light"
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          <div className="border border-white/10 bg-white/[0.04] px-6 py-16 text-center">
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
