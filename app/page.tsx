import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const { data: ventasHoy } = await supabase
    .from("ventas")
    .select("id, total, vendedor, created_at")
    .gte("created_at", hoy.toISOString());

  const { data: productos } = await supabase
    .from("productos")
    .select("id")
    .eq("activo", true);

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

  const ventasCount = ventasHoy?.length || 0;
  const productosCount = productos?.length || 0;

  const stockBajo =
    inventario?.filter((item: any) => {
      return item.sedes?.nombre === "Tienda Mercado" && Number(item.cantidad || 0) <= 2;
    }) || [];

  const totalAlmacen =
    inventario
      ?.filter((item: any) => item.sedes?.nombre === "Almacén Central")
      .reduce((total: number, item: any) => total + Number(item.cantidad || 0), 0) || 0;

  const totalMercado =
    inventario
      ?.filter((item: any) => item.sedes?.nombre === "Tienda Mercado")
      .reduce((total: number, item: any) => total + Number(item.cantidad || 0), 0) || 0;

  const modulos = [
    { nombre: "Productos", href: "/productos", descripcion: "Registrar modelo, talla, color y stock." },
    { nombre: "Inventario", href: "/inventario", descripcion: "Ver stock en almacén y mercado." },
    { nombre: "Movimientos", href: "/movimientos", descripcion: "Trasladar stock al mercado." },
    { nombre: "Ventas", href: "/ventas", descripcion: "Registrar ventas del día." },
    { nombre: "Reportes", href: "/reportes", descripcion: "Resumen de ventas y stock." },
    { nombre: "Alertas", href: "/alertas", descripcion: "Productos con poco stock." },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">Sistema de Ventas Chusos</h1>
          <p className="mt-1 text-sm text-slate-600 md:text-base">
            Control de productos, inventario, traslados y ventas.
          </p>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-slate-600">Ventas hoy</div>
            <div className="mt-1 text-2xl font-bold">{ventasCount}</div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-slate-600">Total vendido hoy</div>
            <div className="mt-1 text-2xl font-bold">S/ {totalVendidoHoy.toFixed(2)}</div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-slate-600">Productos activos</div>
            <div className="mt-1 text-2xl font-bold">{productosCount}</div>
          </div>

          <Link href="/alertas" className="rounded-xl bg-red-50 p-4 shadow">
            <div className="text-sm text-red-700">Stock bajo</div>
            <div className="mt-1 text-2xl font-bold text-red-800">{stockBajo.length}</div>
          </Link>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-slate-600">Stock Almacén Central</div>
            <div className="mt-1 text-2xl font-bold">{totalAlmacen}</div>
            <div className="mt-1 text-xs text-slate-500">Incluye la casa.</div>
          </div>

          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-slate-600">Stock Tienda Mercado</div>
            <div className="mt-1 text-2xl font-bold">{totalMercado}</div>
            <div className="mt-1 text-xs text-slate-500">Punto de venta en el mercado.</div>
          </div>
        </div>

        {stockBajo.length > 0 && (
          <div className="mb-6 rounded-xl bg-red-50 p-4 shadow">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-red-800">Alertas importantes</h2>
              <Link href="/alertas" className="text-sm font-semibold text-red-700">
                Ver todas
              </Link>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              {stockBajo.slice(0, 3).map((item: any) => (
                <div key={item.productos?.id} className="rounded-lg bg-white p-3 text-sm">
                  <div className="font-semibold">{item.productos?.modelo}</div>
                  <div className="text-slate-600">
                    Talla {item.productos?.talla} · {item.productos?.color}
                  </div>
                  <div className="mt-1 font-bold text-red-700">Stock: {item.cantidad}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-3">
          {modulos.map((modulo) => (
            <Link
              key={modulo.href}
              href={modulo.href}
              className="rounded-xl bg-white p-4 shadow transition hover:bg-slate-50"
            >
              <div className="text-lg font-semibold">{modulo.nombre}</div>
              <div className="mt-1 text-sm text-slate-600">{modulo.descripcion}</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
