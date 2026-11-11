import { NextResponse, type NextRequest } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import { getCurrentUserFromRequest } from "@/lib/auth/session";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const allowedTypes = new Map([
  [
    "image/jpeg",
    (bytes: Uint8Array) =>
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff,
  ],
  [
    "image/png",
    (bytes: Uint8Array) =>
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  ],
  [
    "image/webp",
    (bytes: Uint8Array) =>
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP",
  ],
]);

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Select a valid image file." },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Select a valid image file." },
      { status: 400 },
    );
  }

  if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json(
      { error: "Images must be smaller than 8 MB." },
      { status: 400 },
    );
  }

  const verifySignature = allowedTypes.get(file.type);
  if (!verifySignature) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, or WebP image." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!verifySignature(bytes)) {
    return NextResponse.json(
      { error: "The selected file contents do not match its image type." },
      { status: 400 },
    );
  }

  const cloudinaryConfig = {
    cloud_name: process.env.NEXT_CLOUD_NAME,
    api_key: process.env.NEXT_CLOUDINARY_API_KEY,
    api_secret: process.env.NEXT_CLOUDINARY_SECRET,
  };
  if (
    !cloudinaryConfig.cloud_name ||
    !cloudinaryConfig.api_key ||
    !cloudinaryConfig.api_secret
  ) {
    console.error("Cloudinary is not configured for hero image uploads.");
    return NextResponse.json(
      { error: "Image uploads are temporarily unavailable." },
      { status: 500 },
    );
  }

  cloudinary.config(cloudinaryConfig);
  try {
    const result = await cloudinary.uploader.upload(
      `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`,
      { folder: "kason-motors/hero", resource_type: "image" },
    );

    return NextResponse.json({ imageUrl: result.secure_url }, { status: 201 });
  } catch (error) {
    console.error("Failed to upload landing page hero image", error);
    return NextResponse.json(
      { error: "Failed to upload hero image." },
      { status: 500 },
    );
  }
}
