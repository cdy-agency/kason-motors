import { getBlogImageReferences } from "@/lib/blog/content";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { BlogPostStatus, Database } from "@/types/database";

type BlogPost = Database["public"]["Tables"]["blog_posts"]["Row"];
type BlogCategory = Database["public"]["Tables"]["blog_categories"]["Row"];
type BlogTag = Database["public"]["Tables"]["blog_tags"]["Row"];

export type PublicBlogPost = BlogPost & {
  authorName: string | null;
  category: BlogCategory | null;
  tags: BlogTag[];
  galleryImages: string[];
};

const getPublicCategoriesAndTags = async () => {
  const supabase = getSupabaseServerClient();
  const [categoriesResult, tagsResult] = await Promise.all([
    supabase.from("blog_categories").select("*").order("name"),
    supabase.from("blog_tags").select("*").order("name"),
  ]);

  if (categoriesResult.error) {
    throw new Error(
      `Failed to load public blog categories: ${categoriesResult.error.message}`,
    );
  }
  if (tagsResult.error) {
    throw new Error(`Failed to load public blog tags: ${tagsResult.error.message}`);
  }

  return {
    categories: categoriesResult.data ?? [],
    tags: tagsResult.data ?? [],
  };
};

const enrichPublicPosts = async (
  posts: BlogPost[],
  categories: BlogCategory[],
  tags: BlogTag[],
): Promise<PublicBlogPost[]> => {
  if (posts.length === 0) return [];

  const postIds = posts.map((post) => post.id);
  const supabase = getSupabaseServerClient();
  const [assignmentsResult, authorsResult] = await Promise.all([
    supabase
      .from("blog_post_tags")
      .select("post_id, tag_id")
      .in("post_id", postIds),
    supabase
      .from("blog_public_post_authors")
      .select("post_id, author_name")
      .in("post_id", postIds),
  ]);

  if (assignmentsResult.error) {
    throw new Error(
      `Failed to load blog article tags: ${assignmentsResult.error.message}`,
    );
  }
  if (authorsResult.error) {
    throw new Error(
      `Failed to load blog article authors: ${authorsResult.error.message}`,
    );
  }

  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const tagsByPostId = new Map<string, BlogTag[]>();
  const authorsByPostId = new Map(
    (authorsResult.data ?? []).map((author) => [author.post_id, author.author_name]),
  );

  for (const assignment of assignmentsResult.data ?? []) {
    const tag = tagsById.get(assignment.tag_id);
    if (!tag) continue;

    const postTags = tagsByPostId.get(assignment.post_id) ?? [];
    postTags.push(tag);
    tagsByPostId.set(assignment.post_id, postTags);
  }

  return posts.map((post) => ({
    ...post,
    category: post.category_id ? categoriesById.get(post.category_id) ?? null : null,
    tags: tagsByPostId.get(post.id) ?? [],
    authorName: authorsByPostId.get(post.id) ?? null,
    galleryImages: [],
  }));
};

export const getPublicBlogCategories = async () => {
  const { categories } = await getPublicCategoriesAndTags();
  return categories;
};

export const getPublicBlogListing = async (
  categorySlug: string | undefined,
  page: number,
) => {
  const { categories, tags } = await getPublicCategoriesAndTags();
  const category = categorySlug
    ? categories.find((item) => item.slug === categorySlug) ?? null
    : null;
  const pageSize = 9;
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .eq("status", "PUBLISHED" satisfies BlogPostStatus)
    .order("published_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (categorySlug && !category) {
    return { posts: [], categories, category: null, page, pageSize, total: 0 };
  }
  if (category) query = query.eq("category_id", category.id);

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`Failed to load published blog posts: ${error.message}`);
  }

  return {
    posts: await enrichPublicPosts(data ?? [], categories, tags),
    categories,
    category,
    page,
    pageSize,
    total: count ?? 0,
  };
};

export const getLatestPublicBlogPosts = async (limit = 3) => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "PUBLISHED" satisfies BlogPostStatus)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load latest blog posts: ${error.message}`);
  }
  if (!data?.length) return [];

  const { categories, tags } = await getPublicCategoriesAndTags();
  return enrichPublicPosts(data, categories, tags);
};

export const getPublicBlogPost = async (slug: string) => {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load blog post: ${error.message}`);
  }
  if (!data) return null;

  const { categories, tags } = await getPublicCategoriesAndTags();
  const [post] = await enrichPublicPosts([data], categories, tags);
  if (!post) return null;

  const { data: imageRows, error: imagesError } = await supabase
    .from("blog_post_images")
    .select("image_url")
    .eq("post_id", post.id);

  if (imagesError) {
    throw new Error(`Failed to load article images: ${imagesError.message}`);
  }

  const inlineImageUrls = new Set(
    getBlogImageReferences(post.content).map((image) => image.url),
  );
  return {
    ...post,
    galleryImages: [
      ...new Set((imageRows ?? []).map((image) => image.image_url)),
    ].filter(
      (imageUrl) => imageUrl !== post.featured_image && !inlineImageUrls.has(imageUrl),
    ),
  };
};

export const getRelatedPublicBlogPosts = async (post: PublicBlogPost) => {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "PUBLISHED")
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(3);

  if (post.category_id) {
    query = query.eq("category_id", post.category_id);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load related blog posts: ${error.message}`);
  }
  if (!data?.length) return [];

  const { categories, tags } = await getPublicCategoriesAndTags();
  return enrichPublicPosts(data, categories, tags);
};

export const getPublicBlogVehicle = async (vehicleId: number) => {
  const { data, error } = await getSupabaseServerClient()
    .from("cars")
    .select("id, name, category, type, price, year, image")
    .eq("id", vehicleId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load linked vehicle: ${error.message}`);
  }

  return data;
};
