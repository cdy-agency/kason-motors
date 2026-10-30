import type { SupabaseClient } from "@supabase/supabase-js";

import { getBlogImageReferences } from "@/lib/blog/content";
import type { Database } from "@/types/database";

type BlogPostStatus = Database["public"]["Tables"]["blog_posts"]["Row"]["status"];

export const validateBlogTagIds = async (
  supabase: SupabaseClient<Database>,
  tagIds: string[],
) => {
  const uniqueIds = [...new Set(tagIds)];

  if (uniqueIds.length === 0) {
    return { error: null, tagIds: uniqueIds };
  }

  const { data, error } = await supabase
    .from("blog_tags")
    .select("id")
    .in("id", uniqueIds);

  if (error) {
    return { error: error.message, tagIds: uniqueIds };
  }

  if (data.length !== uniqueIds.length) {
    return { error: "One or more selected tags no longer exist.", tagIds: uniqueIds };
  }

  return { error: null, tagIds: uniqueIds };
};

export const replaceBlogPostTags = async (
  supabase: SupabaseClient<Database>,
  postId: string,
  tagIds: string[],
) => {
  const { error: deleteError } = await supabase
    .from("blog_post_tags")
    .delete()
    .eq("post_id", postId);

  if (deleteError) {
    throw new Error(`Failed to update article tags: ${deleteError.message}`);
  }

  if (tagIds.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("blog_post_tags")
    .insert(tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })));

  if (insertError) {
    throw new Error(`Failed to update article tags: ${insertError.message}`);
  }
};

export const replaceBlogPostImages = async (
  supabase: SupabaseClient<Database>,
  postId: string,
  featuredImage: string | null,
  content: string,
  galleryImages: string[] = [],
) => {
  const images = new Map<string, string | null>();

  for (const imageUrl of galleryImages) {
    images.set(imageUrl, null);
  }

  if (featuredImage) {
    images.set(featuredImage, null);
  }

  for (const image of getBlogImageReferences(content)) {
    images.set(image.url, image.caption);
  }

  const { error: deleteError } = await supabase
    .from("blog_post_images")
    .delete()
    .eq("post_id", postId);

  if (deleteError) {
    throw new Error(`Failed to update article images: ${deleteError.message}`);
  }

  if (images.size > 0) {
    const { error: insertError } = await supabase
      .from("blog_post_images")
      .insert(
        [...images.entries()].map(([image_url, caption]) => ({
          post_id: postId,
          image_url,
          caption,
        })),
      );

    if (insertError) {
      throw new Error(`Failed to update article images: ${insertError.message}`);
    }
  }

  return [...images.keys()];
};

export const getStatusPublicationDate = (
  status: BlogPostStatus,
  previousPublishedAt: string | null,
) => {
  if (status === "PUBLISHED") {
    return previousPublishedAt ?? new Date().toISOString();
  }

  return status === "ARCHIVED" ? previousPublishedAt : null;
};
