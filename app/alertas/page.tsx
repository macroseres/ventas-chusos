import { supabase } from "@/lib/supabase";
import { Card, PageShell } from "@/app/components/Shell";

export default async function AlertasPage(){
 const {data:inv}=await supabase.from("inventario").select(`cantidad, sedes(nombre), productos(id,modelo,talla,color,activo)`).order("cantidad");
 const alertas=(inv||[]).filter((i:any)=>i.sedes?.nombre==="Tienda Mercado" && i.productos?.activo && Number(i.cantidad||0)<=2);
 return <PageShell title="Alertas" subtitle="Productos con 2 pares o menos en Tienda Mercado."><div className="grid gap-3">{alertas.length?alertas.map((i:any)=><Card key={i.productos?.id} className={Number(i.cantidad)===0?"border-2 border-red-500 bg-red-50":""}><div className="flex justify-between gap-3"><div><div className="font-bold">{i.productos?.modelo}</div><div className="text-sm text-slate-600">Talla {i.productos?.talla} · {i.productos?.color}</div></div><div className="rounded-xl bg-slate-950 px-4 py-2 text-center text-white"><div className="text-xs">Stock</div><div className="text-2xl font-bold">{i.cantidad}</div></div></div></Card>):<Card><div className="text-slate-500">No hay alertas.</div></Card>}</div></PageShell>
}
