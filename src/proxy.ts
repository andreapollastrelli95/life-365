import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { CLOUD_ENABLED, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/**
 * Proxy (ex middleware, Next 16). In modalità cloud rinnova la sessione Supabase e manda a
 * /login chi non è autenticato. È un controllo di comodo: la protezione
 * vera dei dati è la RLS di Supabase. In modalità locale non fa nulla.
 */
export async function proxy(request: NextRequest) {
  if (!CLOUD_ENABLED) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isLogin = path.startsWith("/login");
  const isAuth = path.startsWith("/auth/");

  if (!data.user && !isLogin && !isAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (data.user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|apple-icon.png|icon-192.png|icon-512.png|icon-maskable-512.png|logo-life365.png).*)"],
};
