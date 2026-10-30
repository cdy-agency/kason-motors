import BlogPostEditor from "@/components/dashboard/blog/BlogPostEditor";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditBlogPostPage({ params }: PageProps) {
  const { id } = await params;
  return <BlogPostEditor postId={id} isNew={false} />;
}
