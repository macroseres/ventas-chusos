import { revalidatePath } from "next/cache";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

async function registrarTraslado(formData: FormData) {
  "use server";

  const producto_id = String(formData.get("producto_id") || "");
  const cantidad = Number(formData.get("cantidad") || 0);

  if (!producto_id || cantidad <= 0) {
    throw new Error("Debes seleccionar un producto y una cantidad válida.");
  }

  const { data: almacen } = await supabase
    .from("sedes")
    .select("id")
    .eq("nombre", "Almacén Central")
    .single();

  const { data: mercado } = await supabase
    .from("sedes")
    .select("id")
    .eq("nombre", "Tienda Mercado")
    .single();

  if (!almacen || !mercado) {
    throw new Error("No se encontraron las sedes necesarias.");
  }

  const { data: stockAlmacen, error: stockError } = await supabase
    .from("inventario")
    .select("id, cantidad")
    .eq("sede_id", almacen.id)
    .eq("producto_id", producto_id)
    .single();

  if (stockError || !stockAlmacen) {
    throw new Error("No existe inventario en Almacén Central para este producto.");
  }

  if (stockAlmacen.cantidad < cantidad) {
    throw new Error("Stock insuficiente en Almacén Central.");
  }

  const { data: stockMercado } = await supabase
    .from("inventario")
    .select("id, cantidad")
    .eq("sede_id", mercado.id)
    .eq("producto_id", producto_id)
    .single();

  await supabase
    .from("inventario")
    .update({ cantidad: stockAlmacen.cantidad - cantidad })
    .eq("id", stockAlmacen.id);

  if (stockMercado) {
    await supabase
      .from("inventario")
      .update({ cantidad: stockMercado.cantidad + cantidad })
      .eq("id", stockMercado.id);
  } else {
    await supabase
      .from("inventario")
      .insert({
        sede_id: mercado.id,
        producto_id,
        cantidad,
        stock_minimo: 0,
      });
  }

  await supabase
    .from("movimientos_stock")
    .insert({
      producto_id,
      sede_origen_id: almacen.id,
      sede_destino_id: mercado.id,
      tipo: "traslado",
      cantidad,
      observacion: "Traslado de Almacén Central a Tienda Mercado",
    });

  revalidatePath("/movimientos");
  revalidatePath("/inventario");
}

export default async function MovimientosPage() {
  const { data: productos } = await supabase
    .from("productos")
    .select(`
      id,
      modelo,
      talla,
      color,
      inventario (
        cantidad,
        sedes (
          nombre
        )
      )
    `)
    .eq("activo", true)
    .order("modelo");

  const { data: movimientos, error } = await supabase
    .from("movimientos_stock")
    .select(`
      id,
      tipo,
      cantidad,
      observacion,
      created_at,
      productos (
        modelo,
        talla,
        color
      ),
      origen:sedes!movimientos_stock_sede_origen_id_fkey (
        nombre
      ),
      destino:sedes!movimientos_stock_sede_destino_id_fkey (
        nombre
      )
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  const stockAlmacen = (producto: any) => {
    const item = producto.inventario?.find(
      (registro: any) => registro.sedes?.nombre === "Almacén Central"
    );
    return item?.cantidad ?? 0;
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-6">
      <section className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Movimientos</h1>
            <p className="text-sm text-slate-600 md:text-base">
              Traslada stock desde Almacén Central hacia Tienda Mercado.
            </p>
          </div>

          <Link href="/" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow">
            Inicio
          </Link>
        </div>

        <form action={registrarTraslado} className="mb-6 rounded-xl bg-white p-4 shadow md:p-5">
          <h2 className="mb-4 text-lg font-semibold md:text-xl">Nuevo traslado</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium">Producto</span>
              <select name="producto_id" required className="min-h-11 rounded-lg border p-2 text-base">
                <option value="">Seleccionar producto</option>
                {productos?.map((producto: any) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.modelo} · Talla {producto.talla} · {producto.color} · Almacén: {stockAlmacen(producto)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Origen</span>
              <input value="Almacén Central" readOnly className="min-h-11 rounded-lg border bg-slate-100 p-2 text-base" />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Destino</span>
              <input value="Tienda Mercado" readOnly className="min-h-11 rounded-lg border bg-slate-100 p-2 text-base" />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium">Cantidad</span>
              <input name="cantidad" type="number" min="1" required placeholder="Ejemplo: 3" className="min-h-11 rounded-lg border p-2 text-base" />
            </label>
          </div>

          <button className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-base font-semibold text-white hover:bg-slate-700 md:w-auto">
            Guardar traslado
          </button>
        </form>

        {error && (
          <div className="mb-4 rounded-xl bg-red-100 p-4 text-sm text-red-700">
            {error.message}
          </div>
        )}

        <div className="mb-3">
          <h2 className="text-lg font-semibold">Últimos movimientos</h2>
        </div>

        <div className="grid gap-3 md:hidden">
          {movimientos && movimientos.length > 0 ? (
            movimientos.map((movimiento: any) => (
              <div key={movimiento.id} className="rounded-xl bg-white p-4 shadow">
                <div className="text-lg font-semibold">
                  {movimiento.productos?.modelo}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Talla {movimiento.productos?.talla} · {movimiento.productos?.color}
                </div>
                <div className="mt-3 text-sm">
                  {movimiento.origen?.nombre} → {movimiento.destino?.nombre}
                </div>
                <div className="mt-2 font-semibold">
                  Cantidad: {movimiento.cantidad}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-white p-4 text-slate-500 shadow">
              No hay movimientos registrados.
            </div>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-xl bg-white shadow md:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-3">Producto</th>
                <th className="p-3">Origen</th>
                <th className="p-3">Destino</th>
                <th className="p-3">Cantidad</th>
                <th className="p-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {movimientos && movimientos.length > 0 ? (
                movimientos.map((movimiento: any) => (
                  <tr key={movimiento.id} className="border-b">
                    <td className="p-3">
                      {movimiento.productos?.modelo} · Talla {movimiento.productos?.talla} · {movimiento.productos?.color}
                    </td>
                    <td className="p-3">{movimiento.origen?.nombre}</td>
                    <td className="p-3">{movimiento.destino?.nombre}</td>
                    <td className="p-3 font-semibold">{movimiento.cantidad}</td>
                    <td className="p-3">
                      {new Date(movimiento.created_at).toLocaleString("es-PE")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={5}>
                    No hay movimientos registrados.
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
