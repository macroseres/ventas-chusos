import { PageShell, Card } from "../components/Shell";
import { getSupabase } from "@/lib/supabase";
import { getLimaDayBounds } from "@/lib/dates";
import type { InventarioConProducto, VentaReporte } from "@/lib/types";

export default async function ReportesPage() {
  const supabase = await getSupabase();
  const { start, end } = getLimaDayBounds();

  const { data: ventasData, error: ventasError } = await supabase
    .from("ventas")
    .select(`
      id,
      vendedor,
      created_at,
      detalle_ventas (
        cantidad,
        productos ( modelo, talla, color )
      )
    `)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: false });
  if (ventasError) throw new Error(ventasError.message);
  const ventasHoy = ventasData as unknown as VentaReporte[];

  const { data: inventarioData, error: inventarioError } = await supabase
    .from("inventario")
    .select(`
      cantidad,
      stock_minimo,
      sedes ( nombre ),
      productos ( id, modelo, talla, color, activo )
    `);
  if (inventarioError) throw new Error(inventarioError.message);
  const inventario = inventarioData as unknown as InventarioConProducto[];

  const paresVendidosHoy =
    ventasHoy.reduce((total, venta) =>
      total + (venta.detalle_ventas || []).reduce((subtotal, detalle) => subtotal + Number(detalle.cantidad || 0), 0),
    0);

  const ventasPorVendedor = ventasHoy.reduce<Record<string, number>>((acc, venta) => {
    const vendedor = venta.vendedor || "Sin vendedor";
    const cantidad = (venta.detalle_ventas || []).reduce((total, detalle) => total + Number(detalle.cantidad || 0), 0);
    acc[vendedor] = (acc[vendedor] || 0) + cantidad;
    return acc;
  }, {});

  const totalAlmacen =
    inventario.filter((item) => item.sedes?.nombre === "Almacén Central")
      .reduce((sum, item) => sum + Number(item.cantidad || 0), 0);

  const totalMercado =
    inventario.filter((item) => item.sedes?.nombre === "Tienda Mercado")
      .reduce((sum, item) => sum + Number(item.cantidad || 0), 0);

  const alertas =
    inventario.filter((item) => item.sedes?.nombre === "Tienda Mercado" && item.productos?.activo && Number(item.cantidad || 0) <= Number(item.stock_minimo || 0));

  return (
    <PageShell title="Reportes" subtitle="Resumen sin precios: ventas, pares vendidos y stock.">
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card><div className="text-xs text-slate-500">Ventas hoy</div><div className="text-2xl font-bold">{ventasHoy.length}</div></Card>
          <Card><div className="text-xs text-slate-500">Pares vendidos</div><div className="text-2xl font-bold">{paresVendidosHoy}</div></Card>
          <Card><div className="text-xs text-slate-500">Stock almacén</div><div className="text-2xl font-bold">{totalAlmacen}</div></Card>
          <Card><div className="text-xs text-slate-500">Stock mercado</div><div className="text-2xl font-bold">{totalMercado}</div></Card>
        </div>

        <Card>
          <h2 className="mb-3 text-lg font-bold">Pares vendidos por vendedor</h2>
          <div className="grid gap-2">
            {Object.keys(ventasPorVendedor).length > 0 ? Object.entries(ventasPorVendedor).map(([vendedor, cantidad]) => (
              <div key={vendedor} className="flex justify-between rounded-xl bg-slate-100 p-3">
                <span>{vendedor}</span><strong>{cantidad} pares</strong>
              </div>
            )) : <div className="text-sm text-slate-500">No hay ventas hoy.</div>}
          </div>
        </Card>

        <Card className={alertas.length ? "bg-red-50" : ""}>
          <h2 className="mb-3 text-lg font-bold">Alertas de stock</h2>
          <div className="text-2xl font-bold">{alertas.length}</div>
          <div className="text-sm text-slate-600">Productos en o debajo de su stock mínimo.</div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-bold">Últimas ventas de hoy</h2>
          <div className="grid gap-3">
            {ventasHoy.length > 0 ? ventasHoy.map((venta) => (
              <div key={venta.id} className="rounded-xl bg-slate-100 p-3">
                {(venta.detalle_ventas || []).map((detalle, index) => (
                  <div key={`${venta.id}-${index}`} className="mb-2 last:mb-0">
                    <div className="font-bold">{detalle.productos?.modelo}</div>
                    <div className="text-sm text-slate-600">Talla {detalle.productos?.talla} · {detalle.productos?.color}</div>
                    <div className="text-sm">Cantidad: <strong>{detalle.cantidad}</strong></div>
                  </div>
                ))}
                <div className="mt-2 border-t pt-2 text-sm">Vendedor: {venta.vendedor || "-"}</div>
              </div>
            )) : <div className="text-sm text-slate-500">No hay ventas hoy.</div>}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
