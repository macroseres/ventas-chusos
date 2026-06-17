import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function InventarioPage() {
  const { data: sedes } = await supabase
    .from("sedes")
    .select("id, nombre, tipo")
    .in("nombre", ["Almacén Central", "Tienda Mercado"])
    .order("nombre");

  const { data: productos, error } = await supabase
    .from("productos")
    .select(`
      id,
      modelo,
      talla,
      color,
      activo,
      inventario (
        cantidad,
        sedes (
          nombre
        )
      )
    `)
    .eq("activo", true)
    .order("modelo");

  const stockPorSede = (producto: any, sedeNombre: string) => {
    const item = producto.inventario?.find(
      (registro: any) => registro.sedes?.nombre === sedeNombre
    );

    return item?.cantidad ?? 0;
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Inventario</h1>
            <p className="text-sm text-slate-600 md:text-base">
              Stock por producto en Almacén Central y Tienda Mercado.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow"
          >
            Inicio
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-4 text-sm text-red-700">
            {error.message}
          </div>
        )}

        <div className="mb-5 grid gap-3 md:grid-cols-2">
          {sedes?.map((sede) => (
            <div key={sede.id} className="rounded-xl bg-white p-4 shadow">
              <div className="text-lg font-semibold">{sede.nombre}</div>
              <div className="text-sm text-slate-600">
                {sede.tipo === "almacen" ? "Almacén y casa" : "Punto de venta"}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-3 md:hidden">
          {productos && productos.length > 0 ? (
            productos.map((producto: any) => {
              const stockAlmacen = stockPorSede(producto, "Almacén Central");
              const stockMercado = stockPorSede(producto, "Tienda Mercado");
              const stockTotal = stockAlmacen + stockMercado;

              return (
                <div key={producto.id} className="rounded-xl bg-white p-4 shadow">
                  <div className="text-lg font-semibold">{producto.modelo}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Talla {producto.talla} · {producto.color}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-lg bg-slate-100 p-2">
                      <div className="font-semibold">{stockAlmacen}</div>
                      <div className="text-xs text-slate-600">Almacén</div>
                    </div>

                    <div className="rounded-lg bg-slate-100 p-2">
                      <div className="font-semibold">{stockMercado}</div>
                      <div className="text-xs text-slate-600">Mercado</div>
                    </div>

                    <div className="rounded-lg bg-slate-900 p-2 text-white">
                      <div className="font-semibold">{stockTotal}</div>
                      <div className="text-xs">Total</div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl bg-white p-4 text-slate-500 shadow">
              No hay productos registrados.
            </div>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-xl bg-white shadow md:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-3">Modelo</th>
                <th className="p-3">Talla</th>
                <th className="p-3">Color</th>
                <th className="p-3">Almacén Central</th>
                <th className="p-3">Tienda Mercado</th>
                <th className="p-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {productos && productos.length > 0 ? (
                productos.map((producto: any) => {
                  const stockAlmacen = stockPorSede(producto, "Almacén Central");
                  const stockMercado = stockPorSede(producto, "Tienda Mercado");
                  const stockTotal = stockAlmacen + stockMercado;

                  return (
                    <tr key={producto.id} className="border-b">
                      <td className="p-3 font-medium">{producto.modelo}</td>
                      <td className="p-3">{producto.talla}</td>
                      <td className="p-3">{producto.color}</td>
                      <td className="p-3">{stockAlmacen}</td>
                      <td className="p-3">{stockMercado}</td>
                      <td className="p-3 font-semibold">{stockTotal}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={6}>
                    No hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
