import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { authorizeBlogAdmin } from "@/lib/blog/admin";
import { getBlogMediaPath, getBlogMediaPublicUrl } from "@/lib/blog/media";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", { extension: "jpg", signature: (bytes: Uint8Array) =>
    bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff }],
  ["image/png", { extension: "png", signature: (bytes: Uint8Array) =>
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a }],
  ["image/webp", { extension: "webp", signature: (bytes: Uint8Array) =>
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP" }],
  ["image/gif", { extension: "gif", signature: (bytes: Uint8Array) =>
    bytes.length >= 6 &&
    ["GIF87a", "GIF89a"].includes(String.fromCharCode(...bytes.slice(0, 6))) }],
]);

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export async function POST(request: NextRequest) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Select a valid image file." }, { status: 400 });
  }

  const file = formData.get("file");
  const postId = formData.get("postId");
  if (!(file instanceof File) || typeof postId !== "string" || !isUuid(postId)) {
    return NextResponse.json({ error: "Select a valid image file." }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "Images must be smaller than 8 MB." }, { status: 400 });
  }

  const imageType = allowedTypes.get(file.type);
  if (!imageType) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, WebP, or GIF image." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!imageType.signature(bytes)) {
    return NextResponse.json(
      { error: "The selected file contents do not match its image type." },
      { status: 400 },
    );
  }

  const path = `posts/${postId}/${randomUUID()}.${imageType.extension}`;
  const { error } = await getSupabaseServiceRoleClient()
    .storage.from("blog-media")
    .upload(path, bytes, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Failed to upload blog image", error);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }

  const imageUrl = getBlogMediaPublicUrl(path);
  if (!getBlogMediaPath(imageUrl, postId)) {
    return NextResponse.json({ error: "Uploaded image URL was invalid." }, { status: 500 });
  }

  return NextResponse.json({ imageUrl }, { status: 201 });
}
