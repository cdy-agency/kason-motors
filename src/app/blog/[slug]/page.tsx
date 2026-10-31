import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CarFront,
  Link2,
  Share2,
} from "lucide-react";
import { FaFacebookF } from "react-icons/fa6";

import BlogImageCarousel from "@/components/blog/BlogImageCarousel";
import Footer from "@/components/landingPage/Footer";
import Navbar from "@/components/landingPage/Navbar";
import { sanitizeBlogContent } from "@/lib/blog/content";
import {
  getPublicBlogPost,
  getPublicBlogVehicle,
  getRelatedPublicBlogPosts,
} from "@/lib/blog/public";

type PageProps = { params: Promise<{ slug: string }> };
const getCachedPost = cache(getPublicBlogPost);

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-RW", { dateStyle: "long" }).format(new Date(value))
    : "";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getCachedPost(slug);
  if (!post) {
    return {
      title: "Article not found | Kason Motors",
      robots: { index: false, follow: false },
    };
  }

  const title = post.title;
  const description = post.excerpt || "Read the latest from Kason Motors.";
  const image = post.featured_image ?? undefined;
  const canonical = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(`/blog/${post.slug}`, process.env.NEXT_PUBLIC_SITE_URL)
    : undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      authors: post.authorName ? [post.authorName] : ["Kason Motors"],
      url: canonical?.toString(),
      images: image ? [{ url: image, alt: post.title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getCachedPost(slug);
  if (!post) notFound();

  const [relatedPosts, vehicle] = await Promise.all([
    getRelatedPublicBlogPosts(post),
    post.vehicle_id ? getPublicBlogVehicle(post.vehicle_id) : Promise.resolve(null),
  ]);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const articleUrl = baseUrl
    ? new URL(`/blog/${post.slug}`, baseUrl).toString()
    : `/blog/${post.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || undefined,
    image: [
      ...new Set([
        post.featured_image,
        ...post.galleryImages,
      ].filter((image): image is string => Boolean(image))),
    ],
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: post.authorName || "Kason Motors",
    },
    publisher: {
      "@type": "Organization",
      name: "Kason Motors",
      logo: {
        "@type": "ImageObject",
        url: baseUrl ? new URL("/logo-nobg.png", baseUrl).toString() : "/logo-nobg.png",
      },
    },
    mainEntityOfPage: articleUrl,
  };
  const encodedStructuredData = JSON.stringify(structuredData).replace(/</g, "\\u003c");

  return (
    <main className="min-h-screen bg-bg text-font">
      <Navbar />
      <article>
        <section className="bg-gray-dark px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-line/25 px-3.5 py-2 text-sm font-semibold text-font/75 transition hover:border-primary-light hover:text-primary-light"
            >
              <ArrowLeft size={16} /> All stories
            </Link>
            <div className="mt-6 grid items-center gap-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-10">
              <header className="min-w-0">
                <div className="flex flex-wrap items-center gap-3 text-sm text-font/70">
                  {post.category && (
                    <Link
                      href={`/blog?category=${encodeURIComponent(post.category.slug)}`}
                      className="rounded-full bg-primary px-3 py-1 font-semibold text-font transition hover:bg-primary-dark"
                    >
                      {post.category.name}
                    </Link>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays size={15} className="text-primary-light" />
                    {formatDate(post.published_at)}
                  </span>
                </div>
                <h1 className="mt-4 text-3xl font-extrabold leading-tight text-font sm:text-4xl xl:text-5xl">
                  {post.title}
                </h1>
                {post.excerpt && (
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-font/70">
                    {post.excerpt}
                  </p>
                )}
                <p className="mt-5 text-sm text-font/55">
                  By{" "}
                  <span className="font-semibold text-font/85">
                    {post.authorName || "Kason Motors"}
                  </span>
                </p>
              </header>
              <BlogImageCarousel
                title={post.title}
                images={[post.featured_image ?? "", ...post.galleryImages]}
              />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-14 sm:px-6">
          <div
            className="blog-article-content py-8 text-base leading-8 text-font/85 sm:py-12 sm:text-lg sm:leading-9"
            dangerouslySetInnerHTML={{ __html: sanitizeBlogContent(post.content) }}
          />

          {(post.tags.length > 0 || post.vehicle_id) && (
            <div className="space-y-8 border-t border-line/25 py-8">
              {post.tags.length > 0 && (
                <section aria-label="Article topics">
                  <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-font/45">
                    Topics
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                    {post.tags.map((tag) => (
                      <span key={tag.id} className="text-sm text-font/70">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {post.vehicle_id && (
                <section
                  aria-label="Related vehicle"
                  className="flex flex-col gap-4 border-t border-line/20 pt-6 sm:flex-row sm:items-center"
                >
                  {vehicle?.image && (
                    <div className="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-gray-dark">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={vehicle.image}
                        alt={vehicle.name || "Related vehicle"}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary-light">
                      <CarFront size={15} /> Related vehicle
                    </p>
                    {vehicle ? (
                      <>
                        <h2 className="mt-1 font-bold text-font">
                          {vehicle.name || "Featured vehicle"}
                        </h2>
                        <p className="mt-1 text-sm text-font/55">
                          {[vehicle.year, vehicle.category, vehicle.type]
                            .filter(Boolean)
                            .join(" · ")}
                          {vehicle.price !== null
                            ? ` · RWF ${vehicle.price.toLocaleString()}`
                            : ""}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-font/60">
                        This vehicle is no longer available in the inventory.
                      </p>
                    )}
                  </div>
                  {vehicle && (
                    <Link
                      href={`/inventory/${vehicle.id}`}
                      className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary-light transition hover:text-accent"
                    >
                      View vehicle <ArrowRight size={15} />
                    </Link>
                  )}
                </section>
              )}
            </div>
          )}

          <section
            aria-label="Share article"
            className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line/25 py-6"
          >
            <h2 className="flex items-center gap-2 text-sm font-semibold text-font/65">
              <Share2 size={16} className="text-primary-light" /> Share
            </h2>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Facebook"
              className="text-sm font-bold text-font/60 transition hover:text-primary-light"
            >
              <FaFacebookF size={17} />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on LinkedIn"
              className="text-sm font-bold text-font/60 transition hover:text-primary-light"
            >
              in
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${articleUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
              className="text-sm font-bold text-font/60 transition hover:text-primary-light"
            >
              WA
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(articleUrl)}`}
              aria-label="Share by email"
              className="text-font/60 transition hover:text-primary-light"
            >
              <Link2 size={17} />
            </a>
          </section>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="border-t border-line/15 bg-gray-dark px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary-light">
              Keep reading
            </p>
            <h2 className="mb-5 text-2xl font-extrabold text-font">Related stories</h2>
            <div className="divide-y divide-line/15">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="group flex items-center justify-between gap-4 py-4"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-primary-light">
                      {relatedPost.category?.name || "Kason Motors"}
                    </span>
                    <span className="mt-1 block truncate font-semibold text-font transition group-hover:text-primary-light">
                      {relatedPost.title}
                    </span>
                  </span>
                  <span className="shrink-0 text-font/40 transition group-hover:translate-x-1 group-hover:text-primary-light">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: encodedStructuredData }}
      />
    </main>
  );
}
