import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUserFromRequest } from "@/lib/auth/session";
import type { CurrentUser } from "@/types/auth";

type BlogAdminAccess =
  | { response: NextResponse; user?: never }
  | { response?: never; user: CurrentUser };

export const authorizeBlogAdmin = async (
  request: NextRequest,
): Promise<BlogAdminAccess> => {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return {
      response: NextResponse.json({ error: "Authentication required." }, { status: 401 }),
    };
  }

  if (user.role !== "admin") {
    return {
      response: NextResponse.json({ error: "Administrator access required." }, { status: 403 }),
    };
  }

  return { user };
};
