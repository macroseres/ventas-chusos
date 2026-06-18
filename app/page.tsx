import { revalidatePath } from "next/cache";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

async function registrarVentaRapida(formData: FormData) {
  "use server";

  const producto_id = String(formData.get("producto_id") || "");
  const cantidad = Number(formData.get("cantidad") || 0);
  const precio_unitario = Number(formData.get("precio_unitario") || 0);
  const metodo_pago = String(formData.get("metodo_pago") || "efectivo");
  const vendedor = String(formData.get("vendedor") || "");

  if (!producto_id || cantidad <= 0 || precio_unitario < 0) {
    throw new Error("Debes seleccionar producto, cantidad y precio.");
  }

  const { data: mercado } = await supabase
    .from("sedes")
    .select("id")
    .eq("nombre", "Tienda Mercado")
    .single();

  if (!mercado) {
    throw new Error("No se encontró Tienda Mercado.");
  }

  const { data: stockMercado } = await supabase
    .from("inventario")
    .select("id, cantidad")
    .eq("sede_id", mercado.id)
    .eq("producto_id", producto_id)
    .single();

  if (!stockMercado) {
    throw new Error("Este producto no tiene stock registrado en Tienda Mercado.");
  }

  if (stockMercado.cantidad < cantidad) {
    throw new Error("Stock insuficiente en Tienda Mercado.");
  }

  const total = cantidad * precio_unitario;

  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert({ sede_id: mercado.id, total, metodo_pago, vendedor })
    .select()
    .single();

  if (ventaError) {
    throw new Error(ventaError.message);
  }

  const { error: detalleError } = await supabase
    .from("detalle_ventas")
    .insert({ venta_id: venta.id, producto_id, cantidad, precio_unitario });

  if (detalleError) {
    throw new Error(detalleError.message);
  }

  const { error: inventarioError } = await supabase
    .from("inventario")
    .update({ cantidad: stockMercado.cantidad - cantidad })
    .eq("id", stockMercado.id);

  if (inventarioError) {
    throw new Error(inventarioError.message);
  }

  revalidatePath("/");
  revalidatePath("/ventas");
  revalidatePath("/inventario");
  revalidatePath("/reportes");
  revalidatePath("/alertas");
}

export default async function Home() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

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
        productos ( modelo, talla, color )
      )
    `)
    .gte("created_at", hoy.toISOString())
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: inventario } = await supabase
    .from("inventario")
    .select(`
      cantidad,
      sedes ( nombre ),
      productos (
        id,
        modelo,
        talla,
        color,
        activo
      )
    `);

  const stockMercado = (producto: any) => {
    const item = producto.inventario?.find(
      (registro: any) => registro.sedes?.nombre === "Tienda Mercado"
    );
    return item?.cantidad ?? 0;
  };

  const productosConStock =
    productos?.filter((producto: any) => stockMercado(producto) > 0) || [];

  const totalVendidoHoy =
    ventasHoy?.reduce((total: number, venta: any) => total + Number(venta.total || 0), 0) || 0;

  const stockBajo =
    inventario?.filter((item: any) => {
      return (
        item.sedes?.nombre === "Tienda Mercado" &&
        item.productos?.activo &&
        Number(item.cantidad || 0) <= 2
      );
    }) || [];

  const accesos = [
    { nombre: "Productos", href: "/productos" },
    { nombre: "Inventario", href: "/inventario" },
    { nombre: "Traslados", href: "/movimientos" },
    { nombre: "Reportes", href: "/reportes" },
  ];

  return (
    <main className="min-h-screen bg-slate-100 pb-24 text-slate-900">
      <section className="mx-auto max-w-3xl p-3 md:p-6">
        <div className="mb-3 rounded-2xl bg-slate-900 p-4 text-white shadow">
          <div className="text-sm text-slate-300">Sistema Chusos</div>
          <h1 className="text-2xl font-bold">Venta rápida</h1>
          <p className="mt-1 text-sm text-slate-300">
            Registra una venta apenas abras la aplicación.
          </p>
        </div>

        <form action={registrarVentaRapida} className="mb-4 rounded-2xl bg-white p-4 shadow">
          <div className="grid gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-semibold">Producto en Tienda Mercado</span>
              <select name="producto_id" required className="min-h-12 rounded-xl border p-3 text-base">
                <option value="">Seleccionar producto</option>
                {productosConStock.map((producto: any) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.modelo} · {producto.talla} · {producto.color} · Stock {stockMercado(producto)}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Cantidad</span>
                <input
                  name="cantidad"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                  className="min-h-12 rounded-xl border p-3 text-base"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Precio</span>
                <input
                  name="precio_unitario"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="S/."
                  className="min-h-12 rounded-xl border p-3 text-base"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Pago</span>
                <select name="metodo_pago" className="min-h-12 rounded-xl border p-3 text-base">
                  <option value="efectivo">Efectivo</option>
                  <option value="yape">Yape</option>
                  <option value="plin">Plin</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Vendedor</span>
                <select name="vendedor" className="min-h-12 rounded-xl border p-3 text-base">
                  <option value="">-</option>
                  <option value="Papá">Papá</option>
                  <option value="Mamá">Mamá</option>
                  <option value="Hermano">Hermano</option>
                </select>
              </label>
            </div>

            <button className="mt-1 min-h-14 rounded-xl bg-slate-900 px-4 py-3 text-lg font-bold text-white shadow hover:bg-slate-700">
              Registrar venta
            </button>
          </div>
        </form>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white p-3 text-center shadow">
            <div className="text-xs text-slate-500">Ventas</div>
            <div className="text-xl font-bold">{ventasHoy?.length || 0}</div>
          </div>

          <div className="rounded-2xl bg-white p-3 text-center shadow">
            <div className="text-xs text-slate-500">Total</div>
            <div className="text-xl font-bold">S/ {totalVendidoHoy.toFixed(0)}</div>
          </div>

          <Link href="/alertas" className="rounded-2xl bg-red-50 p-3 text-center shadow">
            <div className="text-xs text-red-700">Alertas</div>
            <div className="text-xl font-bold text-red-800">{stockBajo.length}</div>
          </Link>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {accesos.map((acceso) => (
            <Link
              key={acceso.href}
              href={acceso.href}
              className="rounded-2xl bg-white p-4 text-center font-semibold shadow"
            >
              {acceso.nombre}
            </Link>
          ))}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Últimas ventas</h2>
            <Link href="/ventas" className="text-sm font-semibold text-slate-600">
              Ver todo
            </Link>
          </div>

          <div className="grid gap-2">
            {ventasHoy && ventasHoy.length > 0 ? (
              ventasHoy.map((venta: any) => {
                const detalle = venta.detalle_ventas?.[0];
                const producto = detalle?.productos;

                return (
                  <div key={venta.id} className="rounded-xl bg-slate-100 p-3">
                    <div className="font-semibold">{producto?.modelo || "Producto"}</div>
                    <div className="text-sm text-slate-600">
                      Talla {producto?.talla} · {producto?.color} · Cantidad {detalle?.cantidad}
                    </div>
                    <div className="mt-1 text-sm">
                      <strong>S/ {Number(venta.total || 0).toFixed(2)}</strong>
                      {venta.vendedor ? ` · ${venta.vendedor}` : ""}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-slate-500">Todavía no hay ventas hoy.</div>
            )}
          </div>
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white p-2 shadow md:hidden">
        <div className="mx-auto grid max-w-3xl grid-cols-4 gap-2 text-center text-xs font-semibold">
          <Link href="/" className="rounded-xl bg-slate-900 px-2 py-2 text-white">Venta</Link>
          <Link href="/inventario" className="rounded-xl px-2 py-2">Stock</Link>
          <Link href="/movimientos" className="rounded-xl px-2 py-2">Traslado</Link>
          <Link href="/reportes" className="rounded-xl px-2 py-2">Reporte</Link>
        </div>
      </nav>
    </main>
  );
}
