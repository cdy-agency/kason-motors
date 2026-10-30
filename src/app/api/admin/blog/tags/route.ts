import { NextResponse, type NextRequest } from "next/server";

import { authorizeBlogAdmin } from "@/lib/blog/admin";
import { slugify } from "@/lib/blog/content";
import { blogTaxonomyInputSchema } from "@/lib/blog/schemas";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

  const { data, error } = await getSupabaseServiceRoleClient()
    .from("blog_tags")
    .select("*")
    .order("name");

  if (error) {
    console.error("Failed to load blog tags", error);
    return NextResponse.json({ error: "Failed to load tags." }, { status: 500 });
  }

  return NextResponse.json({ tags: data ?? [] });
}

export async function POST(request: NextRequest) {
  const access = await authorizeBlogAdmin(request);
  if (access.response) return access.response;

  const body: unknown = await request.json().catch(() => null);
  const parsed = blogTaxonomyInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a tag name." }, { status: 400 });
  }

  const slug = slugify(parsed.data.name);
  if (!slug) {
    return NextResponse.json({ error: "Enter a name that can form a URL slug." }, { status: 400 });
  }

  const { data, error } = await getSupabaseServiceRoleClient()
    .from("blog_tags")
    .insert({ name: parsed.data.name, slug })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "A tag with this name already exists." }, { status: 409 });
    }

    console.error("Failed to create blog tag", error);
    return NextResponse.json({ error: "Failed to create tag." }, { status: 500 });
  }

  return NextResponse.json({ tag: data }, { status: 201 });
}
