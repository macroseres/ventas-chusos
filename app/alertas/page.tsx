import { PageShell, Card } from "../components/Shell";
import { getSupabase } from "@/lib/supabase";
import type { InventarioConProducto } from "@/lib/types";

export default async function AlertasPage() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("inventario")
    .select(`
      cantidad,
      stock_minimo,
      sedes ( nombre ),
      productos ( id, modelo, talla, color, activo )
    `)
    .order("cantidad");
  const inventario = (data || []) as unknown as InventarioConProducto[];

  const alertas =
    inventario.filter((item) => (
      item.sedes?.nombre === "Tienda Mercado" &&
      item.productos?.activo &&
      Number(item.cantidad || 0) <= Number(item.stock_minimo || 0)
    ));

  return (
    <PageShell title="Alertas" subtitle="Productos cuyo stock está en o debajo del mínimo definido.">
      {error && <Card className="bg-red-50 text-red-700">{error.message}</Card>}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card>
          <div className="text-sm text-slate-500">Alertas</div>
          <div className="text-3xl font-bold">{alertas.length}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500">Agotados</div>
          <div className="text-3xl font-bold">
            {alertas.filter((alerta) => Number(alerta.cantidad || 0) === 0).length}
          </div>
        </Card>
      </div>

      <div className="grid gap-3">
        {alertas.length > 0 ? alertas.map((item) => (
          <Card key={`${item.productos?.id}-${item.sedes?.nombre}`} className={Number(item.cantidad || 0) === 0 ? "bg-red-50" : "bg-yellow-50"}>
            <div className="font-bold">{item.productos?.modelo}</div>
            <div className="text-sm text-slate-600">Talla {item.productos?.talla} · {item.productos?.color}</div>
            <div className="mt-2 text-sm">Stock actual: <strong>{item.cantidad}</strong></div>
            <div className="text-sm">Stock mínimo: <strong>{item.stock_minimo}</strong></div>
          </Card>
        )) : (
          <Card className="text-slate-500">No hay alertas de stock.</Card>
        )}
      </div>
    </PageShell>
  );
}
