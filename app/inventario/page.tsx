import { getSupabase } from "@/lib/supabase";
import { Card, PageShell } from "@/app/components/Shell";
import type { ProductoConInventario } from "@/lib/types";

function stock(producto: ProductoConInventario, sede: string) {
  return Number(producto.inventario?.find((item) => item.sedes?.nombre === sede)?.cantidad || 0);
}

export default async function InventarioPage() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("productos")
    .select(`id, modelo, talla, color, activo, inventario (cantidad, sedes (nombre))`)
    .eq("activo", true)
    .order("modelo");
  if (error) throw new Error(error.message);
  const productos = data as unknown as ProductoConInventario[];

  return (
    <PageShell title="Inventario" subtitle="Stock separado entre Casa/Almacén Central y Tienda Mercado.">
      <div className="grid gap-3">
        {productos.map((p) => {
          const casa = stock(p, "Almacén Central");
          const mercado = stock(p, "Tienda Mercado");
          return <Card key={p.id}><div className="font-bold">{p.modelo}</div><div className="text-sm text-slate-600">Talla {p.talla} · {p.color}</div><div className="mt-3 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-slate-100 p-3"><div className="text-lg font-bold">{casa}</div><div className="text-xs">Casa</div></div><div className="rounded-xl bg-slate-100 p-3"><div className="text-lg font-bold">{mercado}</div><div className="text-xs">Mercado</div></div><div className="rounded-xl bg-slate-950 p-3 text-white"><div className="text-lg font-bold">{casa+mercado}</div><div className="text-xs">Total</div></div></div></Card>
        })}
      </div>
    </PageShell>
  );
}
