import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUserFromRequest } from "@/lib/auth/session";
import { heroSlidesSchema } from "@/lib/hero";
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase-server";

export async function GET() {
  const { data, error } = await getSupabaseServerClient()
    .from("hero_settings")
    .select("slides")
    .eq("id", "landing")
    .maybeSingle();

  if (error) {
    console.error("Failed to load landing page hero banners", error);
    return NextResponse.json(
      { error: "Failed to load hero banners." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ slides: [] });
  }

  const parsed = heroSlidesSchema.safeParse(data.slides);
  if (!parsed.success) {
    console.error("Stored landing page hero banners are invalid", parsed.error);
    return NextResponse.json(
      { error: "Saved hero banners are invalid." },
      { status: 500 },
    );
  }

  return NextResponse.json({ slides: parsed.data });
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Administrator access required." },
      { status: 403 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  const parsedBody = z
    .object({ slides: heroSlidesSchema })
    .safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Use up to 10 valid banners with HTTPS image URLs.",
      },
      { status: 400 },
    );
  }
  const slides = parsedBody.data.slides;

  const { error } = await getSupabaseServiceRoleClient()
    .from("hero_settings")
    .upsert(
      {
        id: "landing",
        slides,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) {
    console.error("Failed to save landing page hero banners", error);
    return NextResponse.json(
      { error: "Failed to save hero banners." },
      { status: 500 },
    );
  }

  return NextResponse.json({ slides });
}
