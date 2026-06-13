import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error("Supabase middleware error:", err);
    // Continue with user = null
  }

  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/superadmin");
  const isLoginPage = request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/login";

  // Check legacy local auth cookie for demo mode
  let localUser = null;
  const localAuthCookie = request.cookies.get("order-pro-auth");
  if (!user && localAuthCookie?.value) {
    try {
      localUser = JSON.parse(localAuthCookie.value);
    } catch {}
  }

  const activeUser = user || localUser;
  const activeRole = user?.user_metadata?.role || localUser?.role;

  if (!activeUser && isProtectedRoute) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // If user is logged in, and tries to go to login page, redirect to /dashboard (or superadmin if applicable)
  if (activeUser && isLoginPage) {
      const url = request.nextUrl.clone();
      url.pathname = activeRole === "superadmin" ? "/superadmin" : "/dashboard";
      return NextResponse.redirect(url);
  }

  // SuperAdmin route protection
  if (activeUser && request.nextUrl.pathname.startsWith("/superadmin")) {
    if (activeRole !== "superadmin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
