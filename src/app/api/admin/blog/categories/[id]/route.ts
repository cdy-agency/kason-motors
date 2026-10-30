import { NextResponse, type NextRequest } from "next/server";

import { authorizeBlogAdmin } from "@/lib/blog/admin";
import { slugify } from "@/lib/blog/content";
import { blogTaxonomyInputSchema } from "@/lib/blog/schemas";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

type RouteContext = { params: Promise<{ id: string }> };
const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = blogTaxonomyInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a category name and description." }, { status: 400 });
  }

  const slug = slugify(parsed.data.name);
  if (!slug) {
    return NextResponse.json({ error: "Enter a name that can form a URL slug." }, { status: 400 });
  }

  const { data, error } = await getSupabaseServiceRoleClient()
    .from("blog_categories")
    .update({
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A category with this name already exists." }, { status: 409 });
    }

    console.error("Failed to update blog category", error);
    return NextResponse.json({ error: "Failed to update category." }, { status: 500 });
  }

  if (!data) return NextResponse.json({ error: "Category not found." }, { status: 404 });
  return NextResponse.json({ category: data });
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

  const { id } = await params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Category not found." }, { status: 404 });
  }

  const { data, error } = await getSupabaseServiceRoleClient()
    .from("blog_categories")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to delete blog category", error);
    return NextResponse.json({ error: "Failed to delete category." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  return NextResponse.json({ success: true });
}
