import { randomUUID } from "node:crypto";

import BlogPostEditor from "@/components/dashboard/blog/BlogPostEditor";
import { requireAdminUser } from "@/lib/auth/session";

export default async function NewBlogPostPage() {
  const currentUser = await requireAdminUser();
  return (
    <BlogPostEditor
      postId={randomUUID()}
      isNew
      authorName={currentUser.fullName}
    />
  );
}
