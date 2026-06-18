import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const { data: isAllowed, error: accessError } = data.user
    ? await supabase.rpc("es_usuario_autorizado")
    : { data: false, error: null };
  if (data.user && isAllowed) return response;

  if (data.user) await supabase.auth.signOut();
  const redirectUrl = new URL("/login", request.url);
  if (accessError) {
    console.error("No se pudo verificar la lista de acceso:", accessError.message);
    redirectUrl.searchParams.set("error", "configuration");
  } else if (data.user) {
    redirectUrl.searchParams.set("error", "unauthorized");
  }
  const redirectResponse = NextResponse.redirect(redirectUrl);
  response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}

export const config = {
  matcher: ["/((?!login|auth/callback|_next/static|_next/image|favicon.ico).*)"],
};
