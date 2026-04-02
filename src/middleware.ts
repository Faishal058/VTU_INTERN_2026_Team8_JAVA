import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware to handle Supabase session refreshing and route protection.
 * It ensures that the user session is kept alive and redirects unauthorized users.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Initialize Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Retrieve the current user from Supabase
  const { data: { user } } = await supabase.auth.getUser();

  // ROUTE PROTECTION LOGIC
  
  // 1. Redirect to login if accessing protected (/dashboard) routes without an active session
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Redirect to dashboard if already logged in and visiting auth pages (login/signup)
  if (user && (
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup"
  )) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  // Apply middleware to all routes except static assets and internal Next.js paths
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};