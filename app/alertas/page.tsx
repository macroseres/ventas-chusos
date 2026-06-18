import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function AlertasPage() {
  const { data: inventario, error } = await supabase
    .from("inventario")
    .select(`
      cantidad,
      stock_minimo,
      sedes (
        nombre
      ),
      productos (
        id,
        modelo,
        talla,
        color,
        activo
      )
    `)
    .order("cantidad");

  const alertas =
    inventario?.filter((item: any) => {
      return (
        item.sedes?.nombre === "Tienda Mercado" &&
        item.productos?.activo &&
        Number(item.cantidad || 0) <= 2
      );
    }) || [];

  const agotados = alertas.filter((item: any) => Number(item.cantidad || 0) === 0);
  const criticos = alertas.filter((item: any) => Number(item.cantidad || 0) > 0);

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-6">
      <section className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Alertas de stock</h1>
            <p className="text-sm text-slate-600 md:text-base">
              Productos con 2 pares o menos en Tienda Mercado.
            </p>
          </div>

          <Link href="/" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow">
            Inicio
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-4 text-sm text-red-700">
            {error.message}
          </div>
        )}

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow">
            <div className="text-sm text-slate-600">Alertas totales</div>
            <div className="mt-1 text-2xl font-bold">{alertas.length}</div>
          </div>

          <div className="rounded-xl bg-red-50 p-4 shadow">
            <div className="text-sm text-red-700">Agotados</div>
            <div className="mt-1 text-2xl font-bold text-red-800">{agotados.length}</div>
          </div>

          <div className="rounded-xl bg-yellow-50 p-4 shadow">
            <div className="text-sm text-yellow-700">Stock crítico</div>
            <div className="mt-1 text-2xl font-bold text-yellow-800">{criticos.length}</div>
          </div>
        </div>

        <div className="grid gap-3">
          {alertas.length > 0 ? (
            alertas.map((item: any) => {
              const cantidad = Number(item.cantidad || 0);
              const agotado = cantidad === 0;

              return (
                <div
                  key={item.productos?.id}
                  className={`rounded-xl p-4 shadow ${
                    agotado ? "bg-red-50" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">{item.productos?.modelo}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Talla {item.productos?.talla} · {item.productos?.color}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Sede: Tienda Mercado
                      </div>
                    </div>

                    <div
                      className={`rounded-lg px-3 py-2 text-center ${
                        agotado ? "bg-red-700 text-white" : "bg-yellow-100 text-yellow-900"
                      }`}
                    >
                      <div className="text-xs">Stock</div>
                      <div className="text-xl font-bold">{cantidad}</div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    {agotado
                      ? "Producto agotado en Tienda Mercado. Debe trasladarse desde Almacén Central."
                      : "Stock bajo. Conviene reponer pronto."}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl bg-white p-4 text-slate-500 shadow">
              No hay productos con stock bajo en Tienda Mercado.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
