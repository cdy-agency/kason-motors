"use client";

import ImageExtension from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

type Props = {
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  galleryImages: string[];
};

export default function BlogArticlePreview({
  title,
  excerpt,
  content,
  featuredImage,
  galleryImages,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false }),
      ImageExtension.configure({ allowBase64: false }),
    ],
    content,
    editable: false,
    immediatelyRender: false,
  });
  const extraImages = galleryImages.filter(
    (imageUrl) => imageUrl !== featuredImage && !content.includes(imageUrl),
  );

  return (
    <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {featuredImage && (
        <div className="relative aspect-[16/8] bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={featuredImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      )}
      <header className="px-6 py-8 sm:px-10">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Kason Motors</p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-gray-900">{title || "Article title"}</h1>
        {excerpt && <p className="mt-4 text-lg leading-relaxed text-gray-600">{excerpt}</p>}
      </header>
      <EditorContent editor={editor} className="blog-editor-content px-6 pb-10 sm:px-10" />
      {extraImages.length > 0 && (
        <section className="border-t border-gray-100 px-6 py-8 sm:px-10">
          <h2 className="mb-4 text-xl font-bold text-gray-900">More article images</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {extraImages.map((imageUrl, index) => (
                <div key={imageUrl} className="overflow-hidden rounded-xl bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt={`Article image ${index + 1}`}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
