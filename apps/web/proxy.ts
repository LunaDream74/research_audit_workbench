import type { NextRequest } from "next/server";
import { updateSession } from "@/src/server/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/workspace/:path*", "/login"],
};

