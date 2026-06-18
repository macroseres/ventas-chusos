import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { cache } from "react";

export const requireSession = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) redirect("/login");
  const { data: isAllowed, error: accessError } = await supabase.rpc("es_usuario_autorizado");
  if (accessError) {
    console.error("No se pudo verificar la lista de acceso:", accessError.message);
    redirect("/login?error=configuration");
  }
  if (!isAllowed) redirect("/login?error=unauthorized");

  return { user: data.user };
});
