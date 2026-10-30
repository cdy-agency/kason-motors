import { z } from "zod";

export const blogPostStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const blogPostInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().max(120).optional().default(""),
  excerpt: z.string().trim().max(400).nullable().optional(),
  content: z.string().max(200_000),
  featuredImage: z.string().url().nullable().optional(),
  galleryImages: z.array(z.string().url()).max(50).optional().default([]),
  status: z.enum(blogPostStatuses),
  categoryId: z.string().uuid().nullable(),
  vehicleId: z.number().int().positive().nullable(),
  tagIds: z.array(z.string().uuid()).max(50),
});

export const blogTaxonomyInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).nullable().optional(),
});
