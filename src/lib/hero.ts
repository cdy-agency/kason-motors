import { z } from "zod";

export type HeroSlide = {
  id: string;
  title: string;
  car: string;
  price: string;
  period: string;
  description: string;
  image: string;
};

export const heroSlidesSchema = z
  .array(
    z.object({
      id: z.string().trim().min(1).max(64),
      title: z.string().trim().max(80),
      car: z.string().trim().min(1).max(100),
      price: z.string().trim().max(40),
      period: z.string().trim().max(30),
      description: z.string().trim().max(240),
      image: z
        .string()
        .trim()
        .url()
        .max(2048)
        .refine((value) => value.startsWith("https://")),
    }),
  )
  .max(10)
  .refine(
    (slides) => new Set(slides.map((slide) => slide.id)).size === slides.length,
  );
