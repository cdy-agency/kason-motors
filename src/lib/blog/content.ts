import sanitizeHtml from "sanitize-html";

const blogHtmlOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "a",
    "blockquote",
    "br",
    "code",
    "em",
    "h2",
    "h3",
    "h4",
    "hr",
    "img",
    "li",
    "ol",
    "p",
    "pre",
    "strong",
    "ul",
  ],
  allowedAttributes: {
    a: ["href", "rel", "target"],
    img: ["alt", "height", "src", "title", "width"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noopener noreferrer",
      target: "_blank",
    }),
  },
};

export const sanitizeBlogContent = (content: string) =>
  sanitizeHtml(content, blogHtmlOptions);

export const getBlogContentText = (content: string) =>
  sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();

export const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");

export type BlogImageReference = {
  caption: string | null;
  url: string;
};

export const getBlogImageReferences = (content: string) => {
  const images: BlogImageReference[] = [];

  for (const match of content.matchAll(/<img\b([^>]*)>/gi)) {
    const attributes = match[1] ?? "";
    const url = attributes.match(/\bsrc="([^"]*)"/i)?.[1];

    if (!url || images.some((image) => image.url === url)) {
      continue;
    }

    images.push({
      caption: attributes.match(/\balt="([^"]*)"/i)?.[1] ?? null,
      url,
    });
  }

  return images;
};
