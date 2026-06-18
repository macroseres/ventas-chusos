import { revalidatePath } from "next/cache";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

async function registrarVenta(formData: FormData) {
  "use server";

  const producto_id = String(formData.get("producto_id") || "");
  const cantidad = Number(formData.get("cantidad") || 0);
  const precio_unitario = Number(formData.get("precio_unitario") || 0);
  const metodo_pago = String(formData.get("metodo_pago") || "efectivo");
  const vendedor = String(formData.get("vendedor") || "");

  if (!producto_id || cantidad <= 0) throw new Error("Datos inválidos.");

  const { data: mercado } = await supabase
    .from("sedes")
    .select("id")
    .eq("nombre", "Tienda Mercado")
    .single();

  if (!mercado) throw new Error("No se encontró Tienda Mercado.");

  const { data: stockMercado } = await supabase
    .from("inventario")
    .select("id, cantidad")
    .eq("sede_id", mercado.id)
    .eq("producto_id", producto_id)
    .single();

  if (!stockMercado) throw new Error("No existe stock en Tienda Mercado.");
  if (stockMercado.cantidad < cantidad) throw new Error("Stock insuficiente en Tienda Mercado.");

  const total = cantidad * precio_unitario;

  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert({ sede_id: mercado.id, total, metodo_pago, vendedor })
    .select()
    .single();

  if (ventaError) throw new Error(ventaError.message);

  const { error: detalleError } = await supabase
    .from("detalle_ventas")
    .insert({ venta_id: venta.id, producto_id, cantidad, precio_unitario });

  if (detalleError) throw new Error(detalleError.message);

  const { error: inventarioError } = await supabase
    .from("inventario")
    .update({ cantidad: stockMercado.cantidad - cantidad })
    .eq("id", stockMercado.id);

  if (inventarioError) throw new Error(inventarioError.message);

  revalidatePath("/ventas");
  revalidatePath("/inventario");
}

export default async function VentasPage() {
  const { data: productos } = await supabase
    .from("productos")
    .select(`
      id,
      modelo,
      talla,
      color,
      activo,
      inventario (
        cantidad,
        sedes ( nombre )
      )
    `)
    .eq("activo", true)
    .order("modelo");

  const { data: ventas, error } = await supabase
    .from("ventas")
    .select(`
      id,
      total,
      metodo_pago,
      vendedor,
      created_at,
      detalle_ventas (
        cantidad,
        precio_unitario,
        subtotal,
        productos ( modelo, talla, color )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  const stockMercado = (producto: any) => {
    const item = producto.inventario?.find((r: any) => r.sedes?.nombre === "Tienda Mercado");
    return item?.cantidad ?? 0;
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-6">
      <section className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Ventas</h1>
            <p className="text-sm text-slate-600 md:text-base">
              Registra ventas de la Tienda Mercado y descuenta stock.
            </p>
          </div>
          <Link href="/" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow">Inicio</Link>
        </div>

        <form action={registrarVenta} className="mb-6 rounded-xl bg-white p-4 shadow md:p-5">
          <h2 className="mb-4 text-lg font-semibold md:text-xl">Nueva venta</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium">Producto</span>
              <select name="producto_id" required className="min-h-11 rounded-lg border p-2 text-base">
                <option value="">Seleccionar producto</option>
                {productos?.map((producto: any) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.modelo} · Talla {producto.talla} · {producto.color} · Mercado: {stockMercado(producto)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Cantidad</span>
              <input name="cantidad" type="number" min="1" required className="min-h-11 rounded-lg border p-2 text-base" />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Precio unitario</span>
              <input name="precio_unitario" type="number" min="0" step="0.01" required className="min-h-11 rounded-lg border p-2 text-base" />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Método de pago</span>
              <select name="metodo_pago" className="min-h-11 rounded-lg border p-2 text-base">
                <option value="efectivo">Efectivo</option>
                <option value="yape">Yape</option>
                <option value="plin">Plin</option>
                <option value="transferencia">Transferencia</option>
                <option value="otro">Otro</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Vendedor</span>
              <select name="vendedor" className="min-h-11 rounded-lg border p-2 text-base">
                <option value="">Seleccionar</option>
                <option value="Papá">Papá</option>
                <option value="Mamá">Mamá</option>
                <option value="Hermano">Hermano</option>
              </select>
            </label>
          </div>

          <button className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-base font-semibold text-white hover:bg-slate-700 md:w-auto">
            Registrar venta
          </button>
        </form>

        {error && <div className="mb-4 rounded-xl bg-red-100 p-4 text-sm text-red-700">{error.message}</div>}

        <h2 className="mb-3 text-lg font-semibold">Últimas ventas</h2>

        <div className="grid gap-3 md:hidden">
          {ventas && ventas.length > 0 ? ventas.map((venta: any) => {
            const d = venta.detalle_ventas?.[0];
            const p = d?.productos;
            return (
              <div key={venta.id} className="rounded-xl bg-white p-4 shadow">
                <div className="text-lg font-semibold">{p?.modelo || "Producto"}</div>
                <div className="mt-1 text-sm text-slate-600">Talla {p?.talla} · {p?.color}</div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>Cantidad: {d?.cantidad}</div>
                  <div>Total: S/ {Number(venta.total).toFixed(2)}</div>
                  <div>Pago: {venta.metodo_pago || "-"}</div>
                  <div>Vendedor: {venta.vendedor || "-"}</div>
                </div>
              </div>
            );
          }) : (
            <div className="rounded-xl bg-white p-4 text-slate-500 shadow">No hay ventas registradas.</div>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-xl bg-white shadow md:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-3">Producto</th>
                <th className="p-3">Cantidad</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Total</th>
                <th className="p-3">Pago</th>
                <th className="p-3">Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {ventas && ventas.length > 0 ? ventas.map((venta: any) => {
                const d = venta.detalle_ventas?.[0];
                const p = d?.productos;
                return (
                  <tr key={venta.id} className="border-b">
                    <td className="p-3">{p?.modelo} · Talla {p?.talla} · {p?.color}</td>
                    <td className="p-3">{d?.cantidad}</td>
                    <td className="p-3">S/ {Number(d?.precio_unitario || 0).toFixed(2)}</td>
                    <td className="p-3 font-semibold">S/ {Number(venta.total).toFixed(2)}</td>
                    <td className="p-3">{venta.metodo_pago || "-"}</td>
                    <td className="p-3">{venta.vendedor || "-"}</td>
                  </tr>
                );
              }) : (
                <tr><td className="p-4 text-slate-500" colSpan={6}>No hay ventas registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
