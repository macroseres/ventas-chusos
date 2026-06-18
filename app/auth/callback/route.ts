import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin));

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(new URL("/login?error=oauth", requestUrl.origin));
  }

  const { data: isAllowed, error: accessError } = await supabase.rpc("es_usuario_autorizado");
  if (accessError) {
    console.error("No se pudo verificar la lista de acceso:", accessError.message);
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=configuration", requestUrl.origin));
  }
  if (!isAllowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?error=unauthorized", requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin));
}
