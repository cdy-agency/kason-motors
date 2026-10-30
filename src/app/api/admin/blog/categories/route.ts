import { NextResponse, type NextRequest } from "next/server";

import { authorizeBlogAdmin } from "@/lib/blog/admin";
import { slugify } from "@/lib/blog/content";
import { blogTaxonomyInputSchema } from "@/lib/blog/schemas";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

  const { data, error } = await getSupabaseServiceRoleClient()
    .from("blog_categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("Failed to load blog categories", error);
    return NextResponse.json({ error: "Failed to load categories." }, { status: 500 });
  }

  return NextResponse.json({ categories: data ?? [] });
}

export async function POST(request: NextRequest) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

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
    .insert({
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A category with this name already exists." }, { status: 409 });
    }

    console.error("Failed to create blog category", error);
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }

  return NextResponse.json({ category: data }, { status: 201 });
}
