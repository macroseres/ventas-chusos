import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { Card, PageShell } from "@/app/components/Shell";

async function trasladar(formData: FormData) {
  "use server";
  const producto_id = String(formData.get("producto_id") || "");
  const cantidad = Number(formData.get("cantidad") || 0);
  if (!producto_id || cantidad <= 0) throw new Error("Datos inválidos.");

  const { data: casa } = await supabase.from("sedes").select("id").eq("nombre", "Almacén Central").single();
  const { data: mercado } = await supabase.from("sedes").select("id").eq("nombre", "Tienda Mercado").single();
  if (!casa || !mercado) throw new Error("Faltan sedes.");

  const { data: stockCasa } = await supabase.from("inventario").select("id, cantidad").eq("sede_id", casa.id).eq("producto_id", producto_id).single();
  if (!stockCasa || Number(stockCasa.cantidad) < cantidad) throw new Error("Stock insuficiente en casa/almacén.");

  const { data: stockMercado } = await supabase.from("inventario").select("id, cantidad").eq("sede_id", mercado.id).eq("producto_id", producto_id).single();
  await supabase.from("inventario").update({ cantidad: Number(stockCasa.cantidad) - cantidad }).eq("id", stockCasa.id);
  if (stockMercado) await supabase.from("inventario").update({ cantidad: Number(stockMercado.cantidad) + cantidad }).eq("id", stockMercado.id);
  else await supabase.from("inventario").insert({ sede_id: mercado.id, producto_id, cantidad, stock_minimo: 0 });

  await supabase.from("movimientos_stock").insert({ producto_id, sede_origen_id: casa.id, sede_destino_id: mercado.id, tipo: "traslado", cantidad, observacion: "Casa/Almacén a Mercado" });
  revalidatePath("/movimientos"); revalidatePath("/inventario"); revalidatePath("/");
}

function stockCasa(p: any) { return Number(p.inventario?.find((i: any)=>i.sedes?.nombre==="Almacén Central")?.cantidad || 0); }

export default async function MovimientosPage() {
  const { data: productos } = await supabase.from("productos").select(`id, modelo, talla, color, activo, inventario (cantidad, sedes (nombre))`).eq("activo", true).order("modelo");
  return <PageShell title="Traslados" subtitle="Mueve stock desde Casa/Almacén Central hacia Tienda Mercado."><Card><form action={trasladar} className="grid gap-3"><select name="producto_id" required className="min-h-12 rounded-xl border p-3 text-base"><option value="">Seleccionar producto</option>{(productos||[]).map((p:any)=><option key={p.id} value={p.id}>{p.modelo} · Talla {p.talla} · {p.color} · Casa: {stockCasa(p)}</option>)}</select><input name="cantidad" type="number" min="1" required placeholder="Cantidad" className="min-h-12 rounded-xl border p-3 text-base"/><button className="min-h-12 rounded-xl bg-slate-950 font-bold text-white">Trasladar al mercado</button></form></Card></PageShell>;
}
