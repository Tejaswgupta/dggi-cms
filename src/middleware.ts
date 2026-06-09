import createSupabaseServerClient from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const pathname = request.nextUrl.pathname;

  // Skip middleware for auth routes
  if (pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // Handle root path - redirect authenticated users to tasks
  if (pathname === "/") {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (user && !userError) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const redirectUrl = new URL("/auth/signin", request.url);
      redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Middleware error:", err);
    const redirectUrl = new URL("/auth/signin", request.url);
    redirectUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
}

export const config = {
  matcher: ["/", "/tasks/:path*", "/dashboard/:path*", "/users/:path*", "/users"],
};
