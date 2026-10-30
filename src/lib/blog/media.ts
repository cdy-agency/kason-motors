import { getSupabaseUrl } from "@/lib/env";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const BLOG_MEDIA_BUCKET = "blog-media";

const getManagedStoragePath = (imageUrl: string, postId: string) => {
  const prefix = `${getSupabaseUrl()}/storage/v1/object/public/${BLOG_MEDIA_BUCKET}/`;

  if (!imageUrl.startsWith(prefix)) {
    return null;
  }

  let path: string;
  try {
    path = decodeURIComponent(imageUrl.slice(prefix.length));
  } catch {
    return null;
  }

  if (!path.startsWith(`posts/${postId}/`) || path.split("/").includes("..")) {
    return null;
  }

  return path;
};

export const removeUnusedBlogImages = async (
  postId: string,
  retainedUrls: string[],
) => {
  const retained = new Set(retainedUrls);
  const storage = getSupabaseServiceRoleClient().storage.from(BLOG_MEDIA_BUCKET);
  const prefix = `posts/${postId}`;
  let offset = 0;

  while (true) {
    const { data, error } = await storage.list(prefix, { limit: 100, offset });
    if (error) {
      throw new Error(`Failed to list article images for cleanup: ${error.message}`);
    }
    if (!data?.length) return;

    const unusedPaths = data
      .map((file) => `${prefix}/${file.name}`)
      .filter((path) => !retained.has(getBlogMediaPublicUrl(path)));

    if (unusedPaths.length === 0) {
      offset += data.length;
      continue;
    }

    const { error: removeError } = await storage.remove(unusedPaths);
    if (removeError) {
      throw new Error(`Failed to remove unused blog images: ${removeError.message}`);
    }
    offset = 0;
  }
};

export const removeAllBlogImages = async (postId: string) => {
  const supabase = getSupabaseServiceRoleClient();
  const prefix = `posts/${postId}`;

  while (true) {
    const { data, error } = await supabase.storage
      .from(BLOG_MEDIA_BUCKET)
      .list(prefix, { limit: 100 });

    if (error) {
      throw new Error(`Failed to list blog images: ${error.message}`);
    }

    if (data.length === 0) {
      return;
    }

    const paths = data.map((file) => `${prefix}/${file.name}`);
    const { error: removeError } = await supabase.storage
      .from(BLOG_MEDIA_BUCKET)
      .remove(paths);

    if (removeError) {
      throw new Error(`Failed to remove blog images: ${removeError.message}`);
    }
  }
};

export const getBlogMediaPublicUrl = (path: string) =>
  getSupabaseServiceRoleClient().storage.from(BLOG_MEDIA_BUCKET).getPublicUrl(path)
    .data.publicUrl;

export const getBlogMediaPath = (imageUrl: string, postId: string) =>
  getManagedStoragePath(imageUrl, postId);
