import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function requireSession() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/login");
  const { data: isAllowed, error: accessError } = await supabase.rpc("es_usuario_autorizado");
  if (accessError || !isAllowed) redirect("/login?error=unauthorized");

  return { user: data.user };
}
