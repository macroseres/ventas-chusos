import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase";
import { Card, PageShell } from "@/app/components/Shell";
import type { ProductoConInventario } from "@/lib/types";
import { SubmitButton } from "@/app/components/SubmitButton";

async function trasladar(formData: FormData) {
  "use server";
  const producto_id = String(formData.get("producto_id") || "");
  const cantidad = Number(formData.get("cantidad") || 0);
  if (!producto_id || !Number.isInteger(cantidad) || cantidad <= 0) throw new Error("Datos inválidos.");

  const supabase = await getSupabase();
  const { error } = await supabase.rpc("trasladar_stock", { p_producto_id: producto_id, p_cantidad: cantidad });
  if (error) throw new Error(error.message);
  revalidatePath("/movimientos"); revalidatePath("/inventario"); revalidatePath("/"); revalidatePath("/alertas"); revalidatePath("/reportes");
}

function stockCasa(producto: ProductoConInventario) {
  return Number(producto.inventario?.find((item) => item.sedes?.nombre === "Almacén Central")?.cantidad || 0);
}

export default async function MovimientosPage() {
  const supabase = await getSupabase();
  const { data, error } = await supabase.from("productos").select(`id, modelo, talla, color, activo, inventario (cantidad, sedes (nombre))`).eq("activo", true).order("modelo");
  if (error) throw new Error(error.message);
  const productos = data as unknown as ProductoConInventario[];
  return <PageShell title="Traslados" subtitle="Mueve stock desde Casa/Almacén Central hacia Tienda Mercado."><Card><form action={trasladar} className="grid gap-3"><select name="producto_id" required className="min-h-12 rounded-xl border p-3 text-base"><option value="">Seleccionar producto</option>{productos.map((producto)=><option key={producto.id} value={producto.id}>{producto.modelo} · Talla {producto.talla} · {producto.color} · Casa: {stockCasa(producto)}</option>)}</select><input name="cantidad" type="number" min="1" step="1" required placeholder="Cantidad" className="min-h-12 rounded-xl border p-3 text-base"/><SubmitButton label="Trasladar al mercado" pendingLabel="Trasladando..." className="min-h-12 rounded-xl bg-slate-950 font-bold text-white" /></form></Card></PageShell>;
}
