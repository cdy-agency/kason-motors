import { NextResponse, type NextRequest } from "next/server";

import { authorizeBlogAdmin } from "@/lib/blog/admin";
import {
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
  replaceBlogPostImages,
  replaceBlogPostTags,
  validateBlogTagIds,
} from "@/lib/blog/persistence";
import { blogPostInputSchema } from "@/lib/blog/schemas";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import type { BlogPostStatus } from "@/types/database";

export async function GET(request: NextRequest) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim().slice(0, 100) ?? "";
  const categoryId = searchParams.get("categoryId");
  const statusFilter = searchParams.get("status");
  const status: BlogPostStatus | null =
    statusFilter === "DRAFT" ||
    statusFilter === "PUBLISHED" ||
    statusFilter === "ARCHIVED"
      ? statusFilter
      : null;
  const requestedPage = Number(searchParams.get("page"));
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, 100_000)
      : 1;
  const pageSize = 20;

  if (
    categoryId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      categoryId,
    )
  ) {
    return NextResponse.json({ error: "Invalid category filter." }, { status: 400 });
  }

  if (statusFilter && !status) {
    return NextResponse.json({ error: "Invalid status filter." }, { status: 400 });
  }

  const supabase = getSupabaseServiceRoleClient();
  let query = supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) query = query.ilike("title", `%${search}%`);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (status) query = query.eq("status", status);

  const [postsResult, categoriesResult, tagsResult] = await Promise.all([
    query,
    supabase.from("blog_categories").select("*").order("name"),
    supabase.from("blog_tags").select("*").order("name"),
  ]);

  if (postsResult.error || categoriesResult.error || tagsResult.error) {
    const error =
      postsResult.error ?? categoriesResult.error ?? tagsResult.error;
    console.error("Failed to load blog administration data", error);
    return NextResponse.json({ error: "Failed to load blog data." }, { status: 500 });
  }

  const posts = postsResult.data ?? [];
  const postIds = posts.map((post) => post.id);
  const assignmentsResult =
    postIds.length > 0
      ? await supabase
          .from("blog_post_tags")
          .select("post_id, tag_id")
          .in("post_id", postIds)
      : { data: [], error: null };

  if (assignmentsResult.error) {
    console.error("Failed to load blog post tags", assignmentsResult.error);
    return NextResponse.json({ error: "Failed to load blog post tags." }, { status: 500 });
  }

  const categoriesById = new Map(
    (categoriesResult.data ?? []).map((category) => [category.id, category]),
  );
  const tagsById = new Map((tagsResult.data ?? []).map((tag) => [tag.id, tag]));
  const postTags = new Map<string, string[]>();

  for (const assignment of assignmentsResult.data ?? []) {
    const tags = postTags.get(assignment.post_id) ?? [];
    const tagName = tagsById.get(assignment.tag_id)?.name;
    if (tagName) tags.push(tagName);
    postTags.set(assignment.post_id, tags);
  }

  return NextResponse.json({
    posts: posts.map((post) => ({
      ...post,
      category: post.category_id ? categoriesById.get(post.category_id) ?? null : null,
      tags: postTags.get(post.id) ?? [],
    })),
    categories: categoriesResult.data ?? [],
    tags: tagsResult.data ?? [],
    page,
    pageSize,
    total: postsResult.count ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

  const body: unknown = await request.json().catch(() => null);
  const parsed = blogPostInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Check the article fields and try again.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  if (input.galleryImages.some((imageUrl) => !getBlogMediaPath(imageUrl, input.id))) {
    return NextResponse.json(
      { error: "One or more selected article images are invalid." },
      { status: 400 },
    );
  }

  const content = sanitizeBlogContent(input.content);
  if (input.status === "PUBLISHED" && !getBlogContentText(content)) {
    return NextResponse.json({ error: "Article content cannot be empty." }, { status: 400 });
  }

  const slug = slugify(input.slug || input.title);
  if (!slug) {
    return NextResponse.json({ error: "Enter a title that can form a URL slug." }, { status: 400 });
  }

  const supabase = getSupabaseServiceRoleClient();
  const tagValidation = await validateBlogTagIds(supabase, input.tagIds);
  if (tagValidation.error) {
    return NextResponse.json({ error: tagValidation.error }, { status: 400 });
  }

  const { data: post, error } = await supabase
    .from("blog_posts")
    .insert({
      id: input.id,
      title: input.title,
      slug,
      excerpt: input.excerpt || null,
      content,
      featured_image: input.featuredImage ?? null,
      status: input.status,
      published_at: input.status === "PUBLISHED" ? new Date().toISOString() : null,
      author_id: access.user.id,
      category_id: input.categoryId,
      vehicle_id: input.vehicleId,
    })
    .select("*")
    .single();

  if (error || !post) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "That article slug is already in use." }, { status: 409 });
    }

    console.error("Failed to create blog post", error);
    return NextResponse.json({ error: "Failed to create article." }, { status: 500 });
  }

  try {
    await replaceBlogPostTags(supabase, post.id, tagValidation.tagIds);
    const retainedImageUrls = await replaceBlogPostImages(
      supabase,
      post.id,
      post.featured_image,
      post.content,
      input.galleryImages,
    );
    await removeUnusedBlogImages(post.id, retainedImageUrls);
  } catch (syncError) {
    const { error: rollbackError } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", post.id);

    if (rollbackError) {
      console.error("Failed to roll back incomplete blog post", rollbackError);
    }
    try {
      await removeAllBlogImages(post.id);
    } catch (cleanupError) {
      console.error("Failed to clean up images for incomplete blog post", cleanupError);
    }

    const message = syncError instanceof Error ? syncError.message : "Unknown error";
    console.error("Failed to save blog post relationships", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ post }, { status: 201 });
}
