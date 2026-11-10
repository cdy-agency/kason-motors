"use client";

import VehicleImageUploader from "@/components/dashboard/listings/VehicleImageUploader";
import {
  BADGE_OPTIONS,
  BODY_TYPE_OPTIONS,
  BRAND_OPTIONS,
  CONDITION_OPTIONS,
  DOOR_OPTIONS,
  DRIVE_TYPE_OPTIONS,
  EXTERIOR_COLOR_OPTIONS,
  FEATURE_OPTIONS,
  FUEL_OPTIONS,
  INTERIOR_COLOR_OPTIONS,
  SEAT_OPTIONS,
  TRANSMISSION_OPTIONS,
} from "@/components/dashboard/listings/vehicleFormOptions";
import {
  uploadVehicleVideo,
} from "@/lib/uploadVehicleImages";
import { VehicleFormData, vehicleFormSchema } from "@/lib/vehicleFormSchema";
import { Select } from "@/components/ui/Select";
import { EMPTY_FORM, FormErrors } from "@/types/car";
import { useMemo, useRef, useState } from "react";

type VehicleFormWizardProps = {
  initialData?: Partial<VehicleFormData>;
  submitLabel: string;
  loadingLabel: string;
  onSubmit: (payload: VehicleFormData) => Promise<void>;
};

const STEPS = ["Basic", "Technical", "Appearance", "Pricing & Media"] as const;

type SelectFieldProps = {
  label: string;
  name: keyof VehicleFormData;
  value: string | undefined;
  options: readonly string[];
  error?: string;
  onChange: (name: keyof VehicleFormData, value: string) => void;
};

type ColorFieldProps = {
  label: string;
  name: keyof VehicleFormData;
  value: string | undefined;
  options: readonly string[];
  error?: string;
  onChange: (name: keyof VehicleFormData, value: string) => void;
};

const COLOR_SWATCHES: Record<string, string> = {
  Black: "#111827",
  White: "#ffffff",
  Silver: "#cbd5e1",
  Gray: "#6b7280",
  Beige: "#e7d3b0",
  Blue: "#2563eb",
  Red: "#dc2626",
  Green: "#16a34a",
  Brown: "#92400e",
};

const REQUIRED_FIELDS_BY_STEP: Record<number, (keyof VehicleFormData)[]> = {
  0: ["title", "brand", "model", "year", "condition", "bodyType", "stockCount"],
  // 1: ["mileage", "engineSize", "fuel", "transmission", "driveType"],
  2: [],
  3: ["price", "description", "image", "imageUrls"],
};

function SelectField({
  label,
  name,
  value,
  options,
  error,
  onChange,
}: SelectFieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
        {label}
      </label>
      <Select
        name={name}
        ariaLabel={label.replace(/\s*\*$/, "")}
        value={value ?? ""}
        options={options.map((option) => ({ value: option, label: option }))}
        onValueChange={(selectedValue) => onChange(name, selectedValue)}
        placeholder={`Select ${label.replace(/\s*\*$/, "")}`}
        variant="light"
        className={`px-4 py-3 shadow-sm ${
          error
            ? "border-red-400 focus:ring-red-400"
            : "hover:border-primary/50"
        }`}
      />
      {error ? <p className="mt-1.5 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function ColorField({
  label,
  name,
  value,
  options,
  error,
  onChange,
}: ColorFieldProps) {
  const selectedColors = (value ?? "")
    .split(",")
    .map((color) => color.trim())
    .filter(Boolean);

  const toggleColor = (color: string) => {
    const nextColors = selectedColors.includes(color)
      ? selectedColors.filter((selectedColor) => selectedColor !== color)
      : [...selectedColors, color];
    onChange(name, nextColors.join(", "));
  };

  return (
    <div>
      <span className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
        {label}
      </span>
      <div
        className={`grid grid-cols-2 gap-2 rounded-lg border bg-white p-2 shadow-sm ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      >
        {options.map((color) => {
          const isSelected = selectedColors.includes(color);
          return (
            <button
              key={color}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggleColor(color)}
              className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                isSelected
                  ? "bg-primary/10 font-semibold text-primary ring-1 ring-primary"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 flex-shrink-0 rounded-full border border-gray-300 shadow-inner"
                style={{ backgroundColor: COLOR_SWATCHES[color] ?? color }}
              />
              {color}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-xs text-gray-400">
        {selectedColors.length > 0
          ? `${selectedColors.length} color${selectedColors.length === 1 ? "" : "s"} selected`
          : "Select one or more colors"}
      </p>
      {error ? <p className="mt-1.5 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

export default function VehicleFormWizard({
  initialData,
  submitLabel,
  loadingLabel,
  onSubmit,
}: VehicleFormWizardProps) {
  const submitRequestedRef = useRef(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<VehicleFormData>({
    ...EMPTY_FORM,
    ...initialData,
    negotiable: initialData?.negotiable ?? false,
    fullOption: initialData?.fullOption ?? false, // ← NEW
    features: initialData?.features ?? [],
    imageUrls: initialData?.imageUrls ?? [],
  } as VehicleFormData);
  const [selectedImages, setSelectedImages] = useState<string[]>(
    initialData?.imageUrls ?? [],
  );
  const [selectedVideo, setSelectedVideo] = useState<string>(
    initialData?.videoUrl ?? "",
  );
  const [selectedVideoName, setSelectedVideoName] = useState<string>(
    initialData?.videoUrl ? "Current uploaded video" : "",
  );
  const canPreviewVideo =
    selectedVideo.startsWith("data:video/") || selectedVideo.startsWith("http");
  const selectedFeatures = form.features ?? [];

  const inputClass = (field: keyof VehicleFormData) =>
    `w-full bg-white border rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm ${
      errors[field as keyof FormErrors]
        ? "border-red-400 focus:ring-red-400"
        : "border-gray-200 focus:ring-primary hover:border-primary/50"
    }`;

  const canGoNext = useMemo(
    () => currentStep < STEPS.length - 1,
    [currentStep],
  );
  const canGoBack = useMemo(() => currentStep > 0, [currentStep]);

  const validateField = (
    name: keyof VehicleFormData,
    value: VehicleFormData[keyof VehicleFormData],
  ) => {
    const result = vehicleFormSchema.safeParse({ ...form, [name]: value });
    const message = !result.success
      ? result.error.flatten().fieldErrors[name]?.[0]
      : undefined;
    setErrors((prev) => ({ ...prev, [name]: message }));
  };

  const handleChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (submitted) {
      validateField(name as keyof VehicleFormData, value);
    }
  };

  const handleSelectChange = (
    name: keyof VehicleFormData,
    value: string,
  ) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (submitted) {
      validateField(name, value);
    }
  };

  const handleColorChange = (name: keyof VehicleFormData, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (submitted) {
      validateField(name, value);
    }
  };

  const handleToggleFeature = (feature: string) => {
    setForm((prev) => {
      const featuresList = prev.features ?? [];
      const hasFeature = featuresList.includes(feature);
      const features = hasFeature
        ? featuresList.filter((item) => item !== feature)
        : [...featuresList, feature];
      return { ...prev, features };
    });
  };

  const handleImagesChange = (images: string[]) => {
    setSelectedImages(images);
    setForm((prev) => ({
      ...prev,
      image: images[0] ?? "",
      imageUrls: images,
    }));

    if (submitted) {
      validateField("image", images[0] ?? "");
      validateField("imageUrls", images);
    }
  };

  const handleVideoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const base64Video = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read selected video"));
      reader.readAsDataURL(file);
    });

    setSelectedVideo(base64Video);
    setSelectedVideoName(file.name);
    setForm((prev) => ({ ...prev, videoUrl: base64Video }));
    event.target.value = "";
  };

  const clearSelectedVideo = () => {
    setSelectedVideo("");
    setSelectedVideoName("");
    setForm((prev) => ({ ...prev, videoUrl: "" }));
  };

  const validateCurrentStep = () => {
    const fields = REQUIRED_FIELDS_BY_STEP[currentStep] ?? [];
    if (fields.length === 0) {
      return true;
    }

    const validationPayload = {
      ...form,
      image: selectedImages[0] ?? "",
      imageUrls: selectedImages,
    };
    const result = vehicleFormSchema.safeParse(validationPayload);

    const stepErrors: FormErrors = {};
    for (const field of fields) {
      const fieldMessage = !result.success
        ? result.error.flatten().fieldErrors[field]?.[0]
        : undefined;
      if (fieldMessage) {
        stepErrors[field as keyof FormErrors] = fieldMessage;
      }
    }

    if (Object.keys(stepErrors).length > 0) {
      setSubmitted(true);
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) {
      return;
    }
    setCurrentStep((prev) => prev + 1);
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!submitRequestedRef.current) {
      return;
    }
    submitRequestedRef.current = false;
    setSubmitted(true);
    const result = vehicleFormSchema.safeParse({
      ...form,
      imageUrls: selectedImages,
      image: selectedImages[0] ?? "",
    });

    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const [key, messages] of Object.entries(
        result.error.flatten().fieldErrors,
      )) {
        fieldErrors[key as keyof FormErrors] = messages?.[0];
      }
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      const uploadedVideoUrl = selectedVideo
        ? await uploadVehicleVideo(selectedVideo)
        : "";
      await onSubmit({
        ...result.data,
        image: selectedImages[0] ?? "",
        imageUrls: selectedImages,
        videoUrl: uploadedVideoUrl || form.videoUrl || "",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    const target = event.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    const isTextArea = tagName === "textarea";
    if (event.key === "Enter" && !isTextArea) {
      event.preventDefault();
    }
  };

  return (
    <form
      onSubmit={submitForm}
      onKeyDown={handleFormKeyDown}
      className="space-y-6"
    >
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`h-7 w-7 rounded-full text-xs font-bold flex items-center justify-center ${index <= currentStep ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}
            >
              {index + 1}
            </div>
            <span
              className={`text-xs ${index <= currentStep ? "text-primary font-semibold" : "text-gray-400"}`}
            >
              {step}
            </span>
            {index < STEPS.length - 1 ? (
              <div className="w-5 h-px bg-gray-200" />
            ) : null}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        <span className="text-red-500 font-semibold">*</span> Required fields
      </p>

      {/* ── STEP 0: Basic ── */}
      {currentStep === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Toyota Land Cruiser VX"
              className={inputClass("title")}
            />
            {errors.title ? (
              <p className="mt-1.5 text-xs text-red-500">{errors.title}</p>
            ) : null}
          </div>
          <SelectField
            label="Brand / Make *"
            name="brand"
            value={form.brand}
            options={BRAND_OPTIONS}
            error={errors.brand}
            onChange={handleSelectChange}
          />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              name="model"
              value={form.model}
              onChange={handleChange}
              placeholder="e.g. Land Cruiser"
              className={inputClass("model")}
            />
            {errors.model ? (
              <p className="mt-1.5 text-xs text-red-500">{errors.model}</p>
            ) : null}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Year <span className="text-red-500">*</span>
            </label>
            <input
              name="year"
              value={form.year}
              onChange={handleChange}
              placeholder="e.g. 2022"
              className={inputClass("year")}
            />
            {errors.year ? (
              <p className="mt-1.5 text-xs text-red-500">{errors.year}</p>
            ) : null}
          </div>
          <SelectField
            label="Condition *"
            name="condition"
            value={form.condition}
            options={CONDITION_OPTIONS}
            error={errors.condition}
            onChange={handleSelectChange}
          />
          <SelectField
            label="Body Type *"
            name="bodyType"
            value={form.bodyType}
            options={BODY_TYPE_OPTIONS}
            error={errors.bodyType}
            onChange={handleSelectChange}
          />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Number of Cars <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              name="stockCount"
              value={form.stockCount}
              onChange={handleChange}
              placeholder="e.g. 3"
              className={inputClass("stockCount")}
            />
            {errors.stockCount ? (
              <p className="mt-1.5 text-xs text-red-500">{errors.stockCount}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ── STEP 1: Technical ── */}
      {currentStep === 1 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Row 1: Fuel Type | Transmission */}
          <SelectField
            label="Fuel Type *"
            name="fuel"
            value={form.fuel}
            options={FUEL_OPTIONS}
            error={errors.fuel}
            onChange={handleSelectChange}
          />
          <SelectField
            label="Transmission *"
            name="transmission"
            value={form.transmission}
            options={TRANSMISSION_OPTIONS}
            error={errors.transmission}
            onChange={handleSelectChange}
          />

          {/* Row 2: Drive Type | Mileage */}
          <SelectField
            label="Drive Type *"
            name="driveType"
            value={form.driveType}
            options={DRIVE_TYPE_OPTIONS}
            error={errors.driveType}
            onChange={handleSelectChange}
          />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Mileage (km) <span className="text-red-500">*</span>
            </label>
            <input
              name="mileage"
              value={form.mileage}
              onChange={handleChange}
              placeholder="e.g. 1000-3000"
              className={inputClass("mileage")}
            />
            {errors.mileage ? (
              <p className="mt-1.5 text-xs text-red-500">{errors.mileage}</p>
            ) : null}
          </div>

          {/* Row 3: Horsepower | Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Horsepower (Optional)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              name="horsepower"
              value={form.horsepower ?? ""}
              onChange={handleChange}
              placeholder="e.g. 150"
              className={inputClass("horsepower")}
            />
            {errors.horsepower ? (
              <p className="mt-1.5 text-xs text-red-500">{errors.horsepower}</p>
            ) : null}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Range (km) (Optional)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              name="range"
              value={form.range ?? ""}
              onChange={handleChange}
              placeholder="e.g. 500"
              className={inputClass("range")}
            />
            {errors.range ? (
              <p className="mt-1.5 text-xs text-red-500">{errors.range}</p>
            ) : null}
          </div>

        </div>
      ) : null}

      {/* ── STEP 2: Appearance ── */}
      {currentStep === 2 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ColorField
            label="Exterior Color (Optional)"
            name="exteriorColor"
            value={form.exteriorColor}
            options={EXTERIOR_COLOR_OPTIONS}
            error={errors.exteriorColor}
            onChange={handleColorChange}
          />
          <ColorField
            label="Interior Color (Optional)"
            name="interiorColor"
            value={form.interiorColor}
            options={INTERIOR_COLOR_OPTIONS}
            error={errors.interiorColor}
            onChange={handleColorChange}
          />
          <SelectField
            label="Doors (Optional)"
            name="doors"
            value={form.doors}
            options={DOOR_OPTIONS}
            error={errors.doors}
            onChange={handleSelectChange}
          />
          <SelectField
            label="Seats (Optional)"
            name="seats"
            value={form.seats}
            options={SEAT_OPTIONS}
            error={errors.seats}
            onChange={handleSelectChange}
          />
        </div>
      ) : null}

      {/* ── STEP 3: Pricing & Media ── */}
      {currentStep === 3 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. 25,000,000 RWF"
                className={inputClass("price")}
              />
              {errors.price ? (
                <p className="mt-1.5 text-xs text-red-500">{errors.price}</p>
              ) : null}
            </div>
            <SelectField
              label="Badge (Optional)"
              name="badge"
              value={form.badge ?? ""}
              options={BADGE_OPTIONS}
              error={errors.badge}
              onChange={handleSelectChange}
            />
          </div>

          {/* ── Negotiable checkbox ── */}
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.negotiable}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  negotiable: event.target.checked,
                }))
              }
              className="accent-primary"
            />
            Negotiable
          </label>

          {/* ── Full Option toggle switch ── NEW ── */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-gray-700">Full Option</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Turn ON if this car comes with all features &amp; extras
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.fullOption ?? false}
              onClick={() =>
                setForm((prev) => ({ ...prev, fullOption: !prev.fullOption }))
              }
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                form.fullOption ? "bg-primary" : "bg-gray-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  form.fullOption ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the vehicle's condition, history, and key details."
              className={inputClass("description")}
              rows={4}
            />
            {errors.description ? (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.description}
              </p>
            ) : null}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
              Video (Optional)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className={inputClass("videoUrl")}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Choose a vehicle walkaround or feature video.
            </p>
            {selectedVideoName ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600">
                  <span className="truncate">{selectedVideoName}</span>
                  <button
                    type="button"
                    onClick={clearSelectedVideo}
                    className="text-red-500 font-semibold"
                  >
                    Remove
                  </button>
                </div>
                {canPreviewVideo ? (
                  <div className="rounded-lg border border-gray-200 overflow-hidden bg-black/5">
                    <video
                      controls
                      preload="metadata"
                      className="w-full max-h-64 bg-black"
                      src={selectedVideo}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <VehicleImageUploader
            label="Vehicle Images *"
            value={selectedImages}
            error={errors.image}
            onChange={handleImagesChange}
            onUploadingChange={setIsUploadingImages}
          />
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Features &amp; Extras (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FEATURE_OPTIONS.map((feature) => (
                <label
                  key={feature}
                  className="inline-flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature)}
                    onChange={() => handleToggleFeature(feature)}
                    className="accent-primary"
                  />
                  {feature}
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => canGoBack && setCurrentStep((prev) => prev - 1)}
          disabled={!canGoBack || isSubmitting || isUploadingImages}
          className="px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 disabled:opacity-40"
        >
          Back
        </button>
        {canGoNext ? (
          <button
            type="button"
            onClick={handleNextStep}
            disabled={isSubmitting || isUploadingImages}
            className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            onClick={() => {
              submitRequestedRef.current = true;
            }}
            disabled={isSubmitting || isUploadingImages}
            className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-70"
          >
            {isSubmitting ? loadingLabel : submitLabel}
          </button>
        )}
      </div>
    </form>
  );
}
