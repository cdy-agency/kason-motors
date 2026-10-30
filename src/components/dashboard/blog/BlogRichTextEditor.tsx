"use client";

import ImageExtension from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { useRef, useState } from "react";

type Props = {
  postId: string;
  content: string;
  onChange: (content: string) => void;
  onUploadingChange: (uploading: boolean) => void;
};

export default function BlogRichTextEditor({
  postId,
  content,
  onChange,
  onUploadingChange,
}: Props) {
  const imageInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      Link.configure({ openOnClick: false }),
      ImageExtension.configure({ allowBase64: false }),
      Placeholder.configure({
        placeholder:
          "Write your article here. Use headings, lists, links, and images to shape your story.",
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => onChange(currentEditor.getHTML()),
  });

  const uploadInlineImages = async (files: File[]) => {
    if (!editor || files.length === 0) return;
    const insertionPosition = editor.state.selection.from;
    setUploading(true);
    onUploadingChange(true);
    setUploadError("");
    const uploadedImages: { src: string; alt: string }[] = [];
    const uploadErrors: string[] = [];

    try {
      for (const file of files) {
        if (file.size > 8 * 1024 * 1024) {
          uploadErrors.push(`${file.name}: images must be smaller than 8 MB.`);
          continue;
        }

        const formData = new FormData();
        formData.set("file", file);
        formData.set("postId", postId);

        try {
          const response = await fetch("/api/admin/blog/media", {
            method: "POST",
            body: formData,
          });
          const result = (await response.json()) as { imageUrl?: string; error?: string };
          if (!response.ok || !result.imageUrl) {
            throw new Error(result.error || "Failed to upload image.");
          }
          uploadedImages.push({ src: result.imageUrl, alt: file.name });
        } catch (error) {
          uploadErrors.push(
            `${file.name}: ${error instanceof Error ? error.message : "Failed to upload image."}`,
          );
        }
      }

      if (uploadedImages.length > 0) {
        try {
          const inserted = editor
            .chain()
            .focus()
            .insertContentAt(
              insertionPosition,
              uploadedImages.map((image) => ({
                type: "image",
                attrs: image,
              })),
            )
            .run();

          if (!inserted) {
            setUploadError("Images uploaded, but could not be inserted into the article.");
            return;
          }
        } catch (error) {
          setUploadError(
            error instanceof Error
              ? `Images uploaded, but could not be inserted: ${error.message}`
              : "Images uploaded, but could not be inserted into the article.",
          );
          return;
        }
      }

      if (uploadErrors.length > 0) {
        const shownErrors = uploadErrors.slice(0, 3).join(" ");
        const remainingCount = uploadErrors.length - 3;
        setUploadError(
          `${uploadedImages.length} of ${files.length} images uploaded. ${shownErrors}${
            remainingCount > 0 ? ` ${remainingCount} more image(s) failed.` : ""
          }`,
        );
      }
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  };

  const addLink = () => {
    if (!editor) return;
    const url = window.prompt("Enter the link URL");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const toolbarButton = (
    label: string,
    icon: React.ReactNode,
    onClick: () => void,
    active = false,
    disabled = false,
  ) => (
    <button
      key={label}
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md p-2 transition ${
        active ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {icon}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
        {toolbarButton("Heading 2", <Heading2 size={17} />, () =>
          editor?.chain().focus().toggleHeading({ level: 2 }).run(),
          editor?.isActive("heading", { level: 2 }),
          !editor,
        )}
        {toolbarButton("Paragraph", <Pilcrow size={17} />, () =>
          editor?.chain().focus().setParagraph().run(),
          editor?.isActive("paragraph"),
          !editor,
        )}
        {toolbarButton("Heading 3", <Heading3 size={17} />, () =>
          editor?.chain().focus().toggleHeading({ level: 3 }).run(),
          editor?.isActive("heading", { level: 3 }),
          !editor,
        )}
        <span className="mx-1 h-6 border-l border-gray-200" />
        {toolbarButton("Bold", <Bold size={17} />, () =>
          editor?.chain().focus().toggleBold().run(),
          editor?.isActive("bold"),
          !editor,
        )}
        {toolbarButton("Italic", <Italic size={17} />, () =>
          editor?.chain().focus().toggleItalic().run(),
          editor?.isActive("italic"),
          !editor,
        )}
        {toolbarButton("Bulleted list", <List size={17} />, () =>
          editor?.chain().focus().toggleBulletList().run(),
          editor?.isActive("bulletList"),
          !editor,
        )}
        {toolbarButton("Numbered list", <ListOrdered size={17} />, () =>
          editor?.chain().focus().toggleOrderedList().run(),
          editor?.isActive("orderedList"),
          !editor,
        )}
        {toolbarButton("Blockquote", <Quote size={17} />, () =>
          editor?.chain().focus().toggleBlockquote().run(),
          editor?.isActive("blockquote"),
          !editor,
        )}
        {toolbarButton("Add link", <Link2 size={17} />, addLink, editor?.isActive("link"), !editor)}
        <button
          type="button"
          onClick={() => imageInput.current?.click()}
          disabled={!editor || uploading}
          title="Add one or more images"
          className="inline-flex items-center gap-2 rounded-md p-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
        >
          <ImagePlus size={17} /> {uploading ? "Uploading…" : "Images"}
        </button>
        <span className="mx-1 h-6 border-l border-gray-200" />
        {toolbarButton("Undo", <Undo2 size={17} />, () => editor?.chain().focus().undo().run(), false, !editor)}
        {toolbarButton("Redo", <Redo2 size={17} />, () => editor?.chain().focus().redo().run(), false, !editor)}
        <input
          ref={imageInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length > 0) void uploadInlineImages(files);
          }}
        />
      </div>
      {uploadError && (
        <p role="alert" className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700">
          {uploadError}
        </p>
      )}
      <EditorContent
        editor={editor}
        className="blog-editor-content min-h-80 px-5 py-4 text-gray-800"
      />
      <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400">
        Select multiple images to upload them together. Images must be under 8 MB each. Select an image and press Backspace to remove it.
      </p>
    </div>
  );
}
