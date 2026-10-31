"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  title: string;
  images: string[];
};

export default function BlogImageCarousel({ title, images }: Props) {
  const imageList = [...new Set(images.filter(Boolean))];
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (imageList.length === 0) return null;

  const scrollToImage = (index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const nextIndex = Math.max(0, Math.min(index, imageList.length - 1));
    container.scrollTo({
      left: nextIndex * container.clientWidth,
      behavior: "smooth",
    });
    setActiveIndex(nextIndex);
  };

  const updateActiveIndex = () => {
    const container = containerRef.current;
    if (!container) return;

    setActiveIndex(
      Math.max(
        0,
        Math.min(
          imageList.length - 1,
          Math.round(container.scrollLeft / container.clientWidth),
        ),
      ),
    );
  };

  return (
    <section
      aria-label="Article photos"
      aria-roledescription="carousel"
      className="min-w-0"
    >
      <div className="relative overflow-hidden rounded-2xl border border-line/25 bg-ink shadow-xl shadow-black/20">
        <div
          ref={containerRef}
          onScroll={updateActiveIndex}
          className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {imageList.map((image, index) => (
            <div
              key={image}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${imageList.length}`}
              className="relative h-full w-full shrink-0 snap-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={`${title} — image ${index + 1}`}
                fetchPriority={index === 0 ? "high" : "auto"}
                loading={index === 0 ? "eager" : "lazy"}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
          ))}
        </div>

        {imageList.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => scrollToImage(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Show previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line/30 bg-bg/80 text-font backdrop-blur-sm transition hover:border-primary-light hover:bg-primary hover:text-font disabled:cursor-not-allowed disabled:opacity-40 sm:left-4 sm:h-11 sm:w-11"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() => scrollToImage(activeIndex + 1)}
              disabled={activeIndex === imageList.length - 1}
              aria-label="Show next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line/30 bg-bg/80 text-font backdrop-blur-sm transition hover:border-primary-light hover:bg-primary hover:text-font disabled:cursor-not-allowed disabled:opacity-40 sm:right-4 sm:h-11 sm:w-11"
            >
              <ChevronRight size={22} />
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-line/25 bg-bg/85 px-3 py-2 backdrop-blur-sm">
              {imageList.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => scrollToImage(index)}
                  aria-label={`Show image ${index + 1}`}
                  aria-current={activeIndex === index ? "true" : undefined}
                  className={`h-1.5 rounded-full transition-all ${
                    activeIndex === index
                      ? "w-5 bg-primary-light"
                      : "w-1.5 bg-font/60 hover:bg-font"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <span className="absolute right-3 top-3 rounded-full border border-line/25 bg-bg/85 px-3 py-1.5 text-xs font-semibold text-font backdrop-blur-sm">
          {activeIndex + 1} / {imageList.length}
        </span>
      </div>
      {imageList.length > 1 && (
        <p className="mt-3 text-center text-xs text-font/50">
          Use the arrows or swipe to browse the photos
        </p>
      )}
    </section>
  );
}
