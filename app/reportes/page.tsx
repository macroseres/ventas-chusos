import { supabase } from "@/lib/supabase";
import { Card, PageShell } from "@/app/components/Shell";

export default async function ReportesPage() {
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const { data: ventas } = await supabase.from("ventas").select(`id,total,vendedor,metodo_pago,created_at, detalle_ventas(cantidad, productos(modelo,talla,color))`).gte("created_at", hoy.toISOString()).order("created_at", {ascending:false});
  const total = ventas?.reduce((a:number,v:any)=>a+Number(v.total||0),0)||0;
  const porVendedor = (ventas||[]).reduce((acc:Record<string,number>,v:any)=>{const k=v.vendedor||"Sin vendedor"; acc[k]=(acc[k]||0)+Number(v.total||0); return acc;},{});
  return <PageShell title="Reportes" subtitle="Resumen rápido del día."><div className="grid gap-3 md:grid-cols-2"><Card><div className="text-sm text-slate-500">Ventas hoy</div><div className="text-3xl font-bold">{ventas?.length||0}</div></Card><Card><div className="text-sm text-slate-500">Total vendido</div><div className="text-3xl font-bold">S/ {total.toFixed(2)}</div></Card></div><div className="mt-4 grid gap-4 md:grid-cols-2"><Card><h2 className="mb-3 font-bold">Por vendedor</h2><div className="grid gap-2">{Object.entries(porVendedor).map(([k,v])=><div key={k} className="flex justify-between rounded-xl bg-slate-100 p-3"><span>{k}</span><strong>S/ {Number(v).toFixed(2)}</strong></div>)}</div></Card><Card><h2 className="mb-3 font-bold">Últimas ventas</h2><div className="grid gap-2">{(ventas||[]).slice(0,8).map((v:any)=>{const d=v.detalle_ventas?.[0]; const p=d?.productos; return <div key={v.id} className="rounded-xl bg-slate-100 p-3"><strong>{p?.modelo}</strong><div className="text-sm text-slate-600">Talla {p?.talla} · {p?.color} · S/ {Number(v.total).toFixed(2)}</div></div>})}</div></Card></div></PageShell>
}
