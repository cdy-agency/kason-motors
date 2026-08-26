const isBase64Image = (value: string) => value.startsWith("data:image/");
const isBase64Video = (value: string) => value.startsWith("data:video/");

export async function uploadVehicleImages(images: string[], signal?: AbortSignal) {
  const sanitizedImages = images.filter((image) => image.trim().length > 0);
  const pendingUploads = sanitizedImages.filter(isBase64Image);

  if (pendingUploads.length === 0) {
    return sanitizedImages;
  }

  const response = await fetch("/api/uploadToCloudinary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({ images: pendingUploads }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to upload images");
  }

  const uploadedImages = Array.isArray(result.imageUrls) ? result.imageUrls : [];
  let uploadedImageIndex = 0;

  return sanitizedImages.map((image) =>
    isBase64Image(image) ? uploadedImages[uploadedImageIndex++] ?? image : image
  );
}

export async function uploadVehicleVideo(video: string) {
  const sanitizedVideo = video.trim();
  if (!sanitizedVideo) {
    return "";
  }

  if (!isBase64Video(sanitizedVideo)) {
    return sanitizedVideo;
  }

  const response = await fetch("/api/uploadToCloudinary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videos: [sanitizedVideo] }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to upload video");
  }

  return Array.isArray(result.videoUrls) ? result.videoUrls[0] ?? "" : "";
}
