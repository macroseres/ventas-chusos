import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function ReportesPage() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const { data: ventasHoy } = await supabase
    .from("ventas")
    .select(`
      id,
      total,
      metodo_pago,
      vendedor,
      created_at,
      detalle_ventas (
        cantidad,
        productos (
          modelo,
          talla,
          color
        )
      )
    `)
    .gte("created_at", hoy.toISOString())
    .order("created_at", { ascending: false });

  const { data: inventario } = await supabase
    .from("inventario")
    .select(`
      cantidad,
      sedes (
        nombre
      ),
      productos (
        id,
        modelo,
        talla,
        color
      )
    `);

  const totalVendidoHoy =
    ventasHoy?.reduce((total: number, venta: any) => total + Number(venta.total || 0), 0) || 0;

  const cantidadVentasHoy = ventasHoy?.length || 0;

  const ventasPorVendedor = (ventasHoy || []).reduce((acc: Record<string, number>, venta: any) => {
    const vendedor = venta.vendedor || "Sin vendedor";
    acc[vendedor] = (acc[vendedor] || 0) + Number(venta.total || 0);
    return acc;
  }, {});

  const stockBajo =
    inventario?.filter((item: any) => {
      return item.sedes?.nombre === "Tienda Mercado" && Number(item.cantidad || 0) <= 2;
    }) || [];

  const stockAlmacen =
    inventario?.filter((item: any) => item.sedes?.nombre === "Almacén Central") || [];

  const stockMercado =
    inventario?.filter((item: any) => item.sedes?.nombre === "Tienda Mercado") || [];

  const totalAlmacen = stockAlmacen.reduce(
    (total: number, item: any) => total + Number(item.cantidad || 0),
    0
  );

  const totalMercado = stockMercado.reduce(
    (total: number, item: any) => total + Number(item.cantidad || 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Reportes</h1>
            <p className="text-sm text-slate-600 md:text-base">
              Resumen de ventas del día, stock y alertas de inventario.
            </p>
          </div>

          <Link href="/" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow">
            Inicio
          </Link>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-slate-600">Ventas de hoy</div>
            <div className="mt-1 text-2xl font-bold">{cantidadVentasHoy}</div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-slate-600">Total vendido hoy</div>
            <div className="mt-1 text-2xl font-bold">S/ {totalVendidoHoy.toFixed(2)}</div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-slate-600">Stock almacén</div>
            <div className="mt-1 text-2xl font-bold">{totalAlmacen}</div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-slate-600">Stock mercado</div>
            <div className="mt-1 text-2xl font-bold">{totalMercado}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-semibold">Ventas por vendedor</h2>

            {Object.keys(ventasPorVendedor).length > 0 ? (
              <div className="grid gap-2">
                {Object.entries(ventasPorVendedor).map(([vendedor, total]) => (
                  <div key={vendedor} className="flex justify-between rounded-lg bg-slate-100 p-3">
                    <span>{vendedor}</span>
                    <span className="font-semibold">S/ {Number(total).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No hay ventas hoy.</div>
            )}
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <h2 className="mb-3 text-lg font-semibold">Stock bajo en Tienda Mercado</h2>

            {stockBajo.length > 0 ? (
              <div className="grid gap-2">
                {stockBajo.map((item: any) => (
                  <div key={item.productos?.id} className="rounded-lg bg-red-50 p-3 text-sm">
                    <div className="font-semibold text-red-800">
                      {item.productos?.modelo}
                    </div>
                    <div className="text-red-700">
                      Talla {item.productos?.talla} · {item.productos?.color} · Stock: {item.cantidad}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                No hay productos con stock bajo en Tienda Mercado.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-white p-4 shadow">
          <h2 className="mb-3 text-lg font-semibold">Últimas ventas de hoy</h2>

          <div className="grid gap-3 md:hidden">
            {ventasHoy && ventasHoy.length > 0 ? (
              ventasHoy.map((venta: any) => {
                const detalle = venta.detalle_ventas?.[0];
                const producto = detalle?.productos;

                return (
                  <div key={venta.id} className="rounded-lg bg-slate-100 p-3">
                    <div className="font-semibold">{producto?.modelo || "Producto"}</div>
                    <div className="text-sm text-slate-600">
                      Talla {producto?.talla} · {producto?.color}
                    </div>
                    <div className="mt-2 text-sm">
                      Total: <strong>S/ {Number(venta.total || 0).toFixed(2)}</strong>
                    </div>
                    <div className="text-sm">Vendedor: {venta.vendedor || "-"}</div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-slate-500">No hay ventas hoy.</div>
            )}
          </div>

          <div className="hidden overflow-hidden rounded-lg border md:block">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-3">Producto</th>
                  <th className="p-3">Cantidad</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Pago</th>
                  <th className="p-3">Vendedor</th>
                  <th className="p-3">Hora</th>
                </tr>
              </thead>
              <tbody>
                {ventasHoy && ventasHoy.length > 0 ? (
                  ventasHoy.map((venta: any) => {
                    const detalle = venta.detalle_ventas?.[0];
                    const producto = detalle?.productos;

                    return (
                      <tr key={venta.id} className="border-b">
                        <td className="p-3">
                          {producto?.modelo} · Talla {producto?.talla} · {producto?.color}
                        </td>
                        <td className="p-3">{detalle?.cantidad}</td>
                        <td className="p-3 font-semibold">S/ {Number(venta.total || 0).toFixed(2)}</td>
                        <td className="p-3">{venta.metodo_pago || "-"}</td>
                        <td className="p-3">{venta.vendedor || "-"}</td>
                        <td className="p-3">
                          {new Date(venta.created_at).toLocaleTimeString("es-PE")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="p-4 text-slate-500" colSpan={6}>
                      No hay ventas hoy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
