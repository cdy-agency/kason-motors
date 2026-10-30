import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, CarFront, Link2, Share2 } from "lucide-react";
import { FaFacebookF } from "react-icons/fa6";

import BlogPostCard from "@/components/blog/BlogPostCard";
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
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <article>
        <header className="mx-auto max-w-4xl px-4 pb-8 pt-10 sm:px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft size={16} /> All stories
          </Link>
          <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {post.category && (
              <Link
                href={`/blog?category=${encodeURIComponent(post.category.slug)}`}
                className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary"
              >
                {post.category.name}
              </Link>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={15} /> {formatDate(post.published_at)}
            </span>
          </div>
          <h1 className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-5 text-lg leading-relaxed text-gray-600">{post.excerpt}</p>
          )}
          <p className="mt-5 text-sm text-gray-500">
            By <span className="font-semibold text-gray-800">{post.authorName || "Kason Motors"}</span>
          </p>
        </header>

        {post.featured_image && (
          <div className="mx-auto mb-10 max-w-6xl px-4 sm:px-6">
            <div className="relative aspect-[16/8] overflow-hidden rounded-2xl bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.featured_image}
                alt={post.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-8">
            <div
              className="blog-article-content text-gray-800"
              dangerouslySetInnerHTML={{ __html: sanitizeBlogContent(post.content) }}
            />
            {post.galleryImages.length > 0 && (
              <section aria-label="More article images">
                <h2 className="mb-4 text-xl font-bold text-gray-900">More images</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {post.galleryImages.map((imageUrl, index) => (
                    <figure
                      key={imageUrl}
                      className="overflow-hidden rounded-xl bg-gray-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={`${post.title} — image ${index + 1}`}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    </figure>
                  ))}
                </div>
              </section>
            )}
          </div>
          <aside className="space-y-7">
            <section className="rounded-2xl border border-gray-200 p-5">
              <h2 className="flex items-center gap-2 font-bold">
                <Share2 size={17} className="text-primary" /> Share this article
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Facebook"
                  className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:text-primary"
                >
                  <FaFacebookF size={18} />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(articleUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on LinkedIn"
                  className="rounded-lg border border-gray-200 p-2 text-sm font-bold text-gray-600 hover:text-primary"
                >
                  in
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${articleUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on WhatsApp"
                  className="rounded-lg border border-gray-200 p-2 text-sm font-bold text-gray-600 hover:text-primary"
                >
                  WA
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(post.title)}&body=${encodeURIComponent(articleUrl)}`}
                  aria-label="Share by email"
                  className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:text-primary"
                >
                  <Link2 size={18} />
                </a>
              </div>
            </section>

            {post.tags.length > 0 && (
              <section className="rounded-2xl border border-gray-200 p-5">
                <h2 className="font-bold">Topics</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {post.vehicle_id && (
              <section className="overflow-hidden rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4 font-bold">
                  <CarFront size={18} className="text-primary" />
                  Related vehicle
                </div>
                {vehicle ? (
                  <div className="p-5">
                    {vehicle.image && (
                      <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={vehicle.image}
                          alt={vehicle.name || "Kason Motors vehicle"}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-bold">{vehicle.name || "Featured vehicle"}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {[vehicle.year, vehicle.category, vehicle.type].filter(Boolean).join(" · ")}
                    </p>
                    {vehicle.price !== null && (
                      <p className="mt-2 font-semibold text-primary">
                        RWF {vehicle.price.toLocaleString()}
                      </p>
                    )}
                    <Link
                      href={`/inventory/${vehicle.id}`}
                      className="mt-4 inline-flex w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
                    >
                      View vehicle
                    </Link>
                  </div>
                ) : (
                  <p className="p-5 text-sm text-gray-600">
                    This vehicle is no longer available in the inventory.
                  </p>
                )}
              </section>
            )}
          </aside>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="bg-gray-50 px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-6 text-2xl font-extrabold">Related stories</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedPosts.map((relatedPost) => (
                <BlogPostCard key={relatedPost.id} post={relatedPost} />
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
