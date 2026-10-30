This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Blog & News

The public news section is available at `/blog`. Administrators can manage articles at `/admin/blog` and categories and tags at `/admin/blog/categories`. Articles are stored in the additive `blog_*` tables; optional vehicle links reference the existing `cars.id` and author records reference `profiles.id`.

Before deploying, review and apply `supabase/migrations/20261030120000_blog_news.sql` to a staging Supabase project first. It creates the blog tables, published-only public read policies, admin policies, and the public `blog-media` image bucket. It does not modify existing vehicle or profile records. The migration is intentionally not run by the application or during a build.

For an existing blog database, also review and apply `supabase/migrations/20261030142000_remove_blog_seo_fields.sql` to remove the unused `meta_title` and `meta_description` columns. Public SEO metadata uses each article's title and excerpt.

In the article editor, upload multiple images to the article gallery and choose one as the cover; remaining gallery images appear below the article text. Inline Tiptap images are also supported. Blog image uploads are limited to JPEG, PNG, WebP, or GIF files up to 8 MB each.

Set `NEXT_PUBLIC_SITE_URL` to the canonical production origin to enable absolute canonical and Open Graph URLs.
