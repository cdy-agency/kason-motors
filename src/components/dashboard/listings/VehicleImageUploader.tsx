"use client";

import { uploadVehicleImages } from "@/lib/uploadVehicleImages";
import { useEffect, useId, useRef, useState } from "react";

type UploadItem = {
  id: string;
  name: string;
  preview: string;
  status: "uploading" | "error";
  error?: string;
};

type VehicleImageUploaderProps = {
  label?: string;
  value: string[];
  error?: string;
  multiple?: boolean;
  maxFiles?: number;
  helperText?: string;
  onChange: (images: string[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
};

export default function VehicleImageUploader({
  label = "Vehicle Images",
  value,
  error,
  multiple = true,
  maxFiles = 8,
  helperText = "PNG, JPG, WEBP up to 10MB each",
  onChange,
  onUploadingChange,
}: VehicleImageUploaderProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadControllers = useRef(new Map<string, AbortController>());
  const imagesRef = useRef(value.filter(Boolean));
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const images = value.filter(Boolean);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(event.target.files ?? []);

    if (fileList.length === 0) {
      return;
    }

    const nextFiles = multiple ? fileList.slice(0, maxFiles - images.length) : fileList.slice(0, 1);
    event.target.value = "";

    if (!multiple) {
      uploadControllers.current.forEach((controller) => controller.abort());
      uploadControllers.current.clear();
      setUploadItems([]);
      imagesRef.current = [];
      onChange([]);
    }

    await Promise.all(nextFiles.map((file) => uploadFile(file)));
  };

  const uploadFile = async (file: File) => {
    const id = `${file.name}-${file.lastModified}-${Math.random()}`;
    const controller = new AbortController();
    uploadControllers.current.set(id, controller);
    const preview = URL.createObjectURL(file);
    setUploadItems((items) => [...items, { id, name: file.name, preview, status: "uploading" }]);
    onUploadingChange?.(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const [uploadedImage] = await uploadVehicleImages([dataUrl], controller.signal);
      if (!uploadedImage || controller.signal.aborted) {
        return;
      }

      const nextImages = multiple
        ? [...imagesRef.current, uploadedImage]
        : [uploadedImage];
      imagesRef.current = nextImages;
      onChange(nextImages);
      setUploadItems((items) => items.filter((item) => item.id !== id));
    } catch (error) {
      if (!controller.signal.aborted) {
        setUploadItems((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : item,
          ),
        );
      }
    } finally {
      uploadControllers.current.delete(id);
      URL.revokeObjectURL(preview);
      onUploadingChange?.(uploadControllers.current.size > 0);
    }
  };

  const cancelUpload = (id: string) => {
    uploadControllers.current.get(id)?.abort();
    uploadControllers.current.delete(id);
    setUploadItems((items) => items.filter((item) => item.id !== id));
    onUploadingChange?.(uploadControllers.current.size > 0);
  };

  const cancelAllUploads = () => {
    uploadControllers.current.forEach((controller) => controller.abort());
    uploadControllers.current.clear();
    setUploadItems([]);
    onUploadingChange?.(false);
  };

  const removeImage = (indexToRemove: number) => {
    const nextImages = images.filter((_, index) => index !== indexToRemove);
    imagesRef.current = nextImages;
    onChange(nextImages);
  };

  const setPrimaryImage = (indexToPromote: number) => {
    if (indexToPromote === 0) {
      return;
    }

    const nextImages = [...images];
    const [selectedImage] = nextImages.splice(indexToPromote, 1);
    nextImages.unshift(selectedImage);
    imagesRef.current = nextImages;
    onChange(nextImages);
  };

  return (
    <div>
      <label htmlFor={inputId} className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
        {label}
      </label>

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
      />

      {images.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadControllers.current.size > 0}
          className={`w-full border-2 border-dashed rounded-xl py-8 flex flex-col items-center justify-center gap-2 transition-all duration-200 group cursor-pointer ${
            error
              ? "border-red-300 bg-red-50/40 hover:border-red-400"
              : "border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10"
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-200 ${
              error ? "shadow-red-100" : "shadow-primary/10"
            }`}
          >
            <svg
              className={`w-6 h-6 ${error ? "text-red-400" : "text-primary"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${error ? "text-red-500" : "text-primary"}`}>
              {multiple ? "Click to upload images" : "Click to upload image"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{helperText}</p>
          </div>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {images.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="relative h-44 rounded-xl overflow-hidden border border-primary/20 shadow-sm group"
              >
                {/* Use a plain img for local/base64 previews selected from the file input. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={`Vehicle preview ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 px-3">
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(index)}
                    className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    {index === 0 ? "Primary" : "Set primary"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="absolute left-2 top-2 rounded-full bg-black/60 backdrop-blur-sm px-2 py-1 text-[11px] font-semibold text-white">
                  {index === 0 ? "Primary image" : `Image ${index + 1}`}
                </div>
              </div>
            ))}
          </div>

          {images.length < maxFiles && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadControllers.current.size > 0}
              className="w-full rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              Add more images
            </button>
          )}
        </div>
      )}

      {uploadItems.length > 0 ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-50/80">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                Upload queue
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {uploadItems.filter((item) => item.status === "uploading").length} in progress
              </p>
            </div>
            <button
              type="button"
              onClick={cancelAllUploads}
              className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Cancel all
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {uploadItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt="" className="h-11 w-11 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-700">{item.name}</p>
                  {item.status === "uploading" ? (
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-200">
                      <div className="h-full w-1/2 animate-pulse rounded-full bg-primary" />
                    </div>
                  ) : (
                    <p className="mt-0.5 truncate text-xs text-red-500">{item.error}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => cancelUpload(item.id)}
                  className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-gray-500 hover:bg-white hover:text-red-600"
                >
                  {item.status === "uploading" ? "Cancel" : "Dismiss"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      ) : null}
    </div>
  );
}
