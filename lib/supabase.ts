import { requireSession } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function getSupabase() {
  await requireSession();
  return createServerSupabaseClient();
}
