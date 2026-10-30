import { NextResponse, type NextRequest } from "next/server";

import { authorizeBlogAdmin } from "@/lib/blog/admin";
import {
  getBlogImageReferences,
  getBlogContentText,
  sanitizeBlogContent,
  slugify,
} from "@/lib/blog/content";
import {
  getBlogMediaPath,
  removeAllBlogImages,
  removeUnusedBlogImages,
} from "@/lib/blog/media";
import {
  getStatusPublicationDate,
  replaceBlogPostImages,
  replaceBlogPostTags,
  validateBlogTagIds,
} from "@/lib/blog/persistence";
import { blogPostInputSchema } from "@/lib/blog/schemas";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export async function GET(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const supabase = getSupabaseServiceRoleClient();
  const [postResult, tagAssignmentsResult, categoriesResult, tagsResult, imagesResult] =
    await Promise.all([
      supabase.from("blog_posts").select("*").eq("id", id).maybeSingle(),
      supabase.from("blog_post_tags").select("tag_id").eq("post_id", id),
      supabase.from("blog_categories").select("*").order("name"),
      supabase.from("blog_tags").select("*").order("name"),
      supabase.from("blog_post_images").select("image_url").eq("post_id", id),
    ]);

  const error =
    postResult.error ??
    tagAssignmentsResult.error ??
    categoriesResult.error ??
    tagsResult.error ??
    imagesResult.error;
  if (error) {
    console.error("Failed to load blog post", error);
    return NextResponse.json({ error: "Failed to load article." }, { status: 500 });
  }

  if (!postResult.data) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const post = postResult.data;
  const inlineImageUrls = new Set(
    getBlogImageReferences(post.content).map((image) => image.url),
  );
  return NextResponse.json({
    post,
    tagIds: (tagAssignmentsResult.data ?? []).map((assignment) => assignment.tag_id),
    categories: categoriesResult.data ?? [],
    tags: tagsResult.data ?? [],
    galleryImages: [...new Set([
      post.featured_image,
      ...(imagesResult.data ?? []).map((image) => image.image_url),
    ].filter((url): url is string => Boolean(url)))].filter(
      (imageUrl) =>
        imageUrl === post.featured_image || !inlineImageUrls.has(imageUrl),
    ),
  });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = blogPostInputSchema.safeParse(body);
  if (!parsed.success || parsed.data.id !== id) {
    return NextResponse.json(
      { error: "Check the article fields and try again." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const content = sanitizeBlogContent(input.content);
  if (input.status === "PUBLISHED" && !getBlogContentText(content)) {
    return NextResponse.json({ error: "Article content cannot be empty." }, { status: 400 });
  }

  const slug = slugify(input.slug || input.title);
  if (!slug) {
    return NextResponse.json({ error: "Enter a title that can form a URL slug." }, { status: 400 });
  }

  const supabase = getSupabaseServiceRoleClient();
  const [existingResult, tagValidation, existingImagesResult] = await Promise.all([
    supabase.from("blog_posts").select("*").eq("id", id).maybeSingle(),
    validateBlogTagIds(supabase, input.tagIds),
    supabase.from("blog_post_images").select("image_url").eq("post_id", id),
  ]);

  if (existingResult.error || existingImagesResult.error) {
    console.error(
      "Failed to retrieve current blog post",
      existingResult.error ?? existingImagesResult.error,
    );
    return NextResponse.json({ error: "Failed to load article." }, { status: 500 });
  }
  if (!existingResult.data) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }
  if (tagValidation.error) {
    return NextResponse.json({ error: tagValidation.error }, { status: 400 });
  }

  const existing = existingResult.data;
  const previouslySavedImages = new Set([
    existing.featured_image,
    ...(existingImagesResult.data ?? []).map((image) => image.image_url),
  ]);
  if (
    input.galleryImages.some(
      (imageUrl) =>
        !getBlogMediaPath(imageUrl, id) && !previouslySavedImages.has(imageUrl),
    )
  ) {
    return NextResponse.json(
      { error: "One or more selected article images are invalid." },
      { status: 400 },
    );
  }

  const { data: post, error } = await supabase
    .from("blog_posts")
    .update({
      title: input.title,
      slug,
      excerpt: input.excerpt || null,
      content,
      featured_image: input.featuredImage ?? null,
      status: input.status,
      published_at: getStatusPublicationDate(input.status, existing.published_at),
      category_id: input.categoryId,
      vehicle_id: input.vehicleId,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !post) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "That article slug is already in use." }, { status: 409 });
    }

    console.error("Failed to update blog post", error);
    return NextResponse.json({ error: "Failed to update article." }, { status: 500 });
  }

  let retainedImageUrls: string[];
  try {
    await replaceBlogPostTags(supabase, id, tagValidation.tagIds);
    retainedImageUrls = await replaceBlogPostImages(
      supabase,
      id,
      post.featured_image,
      post.content,
      input.galleryImages,
    );
  } catch (syncError) {
    const message = syncError instanceof Error ? syncError.message : "Unknown error";
    console.error("Failed to update blog post relationships", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    await removeUnusedBlogImages(id, retainedImageUrls);
  } catch (cleanupError) {
    const message = cleanupError instanceof Error ? cleanupError.message : "Unknown error";
    console.error("Failed to remove unused article images", message);
    return NextResponse.json(
      { error: "Article saved, but some unused images could not be removed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ post });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Article not found." }, { status: 404 });
  }

  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete blog post", error);
    return NextResponse.json({ error: "Failed to delete article." }, { status: 500 });
  }

  try {
    await removeAllBlogImages(id);
  } catch (cleanupError) {
    const message = cleanupError instanceof Error ? cleanupError.message : "Unknown error";
    console.error("Article deleted but media cleanup failed", message);
    return NextResponse.json(
      { error: "Article deleted, but its images could not all be removed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
