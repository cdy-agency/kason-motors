"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import type { HeroSlide } from "@/lib/hero";

export default function Hero() {
  const ref = useRef(null);
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const loadSlides = async () => {
      try {
        const response = await fetch("/api/hero");
        const result = (await response.json()) as {
          slides?: HeroSlide[];
          error?: string;
        };
        if (!response.ok || !Array.isArray(result.slides)) {
          throw new Error(result.error || "Failed to load hero banners.");
        }
        setSlides(result.slides);
      } catch (loadError) {
        console.error("Failed to load landing page hero banners", loadError);
        setSlides([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSlides();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const slide = slides[current];

  if (isLoading) {
    return (
      <section
        ref={ref}
        className="relative h-screen min-h-[600px] overflow-hidden bg-black"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/80" />
        <div className="relative z-10 flex h-full flex-col justify-center px-4 pt-20 sm:px-6 md:px-12 lg:px-24">
          <div className="animate-pulse">
            <div className="mb-4 h-3 w-40 rounded bg-white/20" />
            <div className="mb-3 h-16 w-2/3 rounded bg-white/20 md:h-20" />
            <div className="mb-5 h-16 w-3/5 rounded bg-white/15 md:h-20" />
            <div className="mb-4 h-10 w-56 rounded bg-primary/30" />
            <div className="h-4 w-72 rounded bg-white/20" />
          </div>
          <div className="mt-8 flex gap-2 md:mt-10">
            {[0, 1, 2].map((dot) => (
              <div key={dot} className="h-1 w-6 rounded-full bg-white/25" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) return null;

  return (
    <section
      ref={ref}
      className="relative h-screen min-h-[600px] overflow-hidden bg-black"
    >
      <motion.div style={{ y }} className="absolute inset-0 scale-110">
        {slides.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: index === current ? 1 : 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
          >
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
              priority={index === 0}
              unoptimized
            />
            <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/40 to-transparent" />
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 flex h-full flex-col justify-center px-4 pt-20 sm:px-6 md:px-12 lg:px-24"
      >
        <motion.div
          key={current}
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary-light">
            {slide?.title}
          </p>
          <h1 className="mb-4 text-3xl leading-none font-bold tracking-tight text-white md:text-3xl lg:text-5xl truncate">
            {slide?.car}
          </h1>
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary-light">
              {slide?.price}
            </span>
            <span className="text-lg text-white/70">{slide?.period}</span>
          </div>
          <p className="mb-8 max-w-sm text-sm text-white/90">
            {slide?.description}
          </p>
        </motion.div>

        <div className="mt-8 flex gap-2 md:mt-10">
          {slides.map((item, index) => (
            <button
              key={`${item.id}-dot`}
              onClick={() => setCurrent(index)}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === current ? "w-8 bg-primary-light" : "w-3 bg-white/40"
              }`}
              aria-label={`Show ${item?.car}`}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
