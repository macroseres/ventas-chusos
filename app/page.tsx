import { revalidatePath } from "next/cache";
import { PageShell, Card } from "./components/Shell";
import { getSupabase } from "@/lib/supabase";
import { getLimaDayBounds } from "@/lib/dates";
import type { InventarioConProducto } from "@/lib/types";
import { SubmitButton } from "@/app/components/SubmitButton";

async function registrarVenta(formData: FormData) {
  "use server";

  const producto_id = String(formData.get("producto_id") || "");
  const sede_id = String(formData.get("sede_id") || "");
  const cantidad = Number(formData.get("cantidad") || 0);

  if (!producto_id || !sede_id || !Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error("Selecciona producto, sede y cantidad.");
  }

  const supabase = await getSupabase();
  const { error } = await supabase.rpc("registrar_venta", {
    p_producto_id: producto_id,
    p_sede_id: sede_id,
    p_vendedor_id: null,
    p_cantidad: cantidad,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/inventario");
  revalidatePath("/alertas");
  revalidatePath("/reportes");
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string | string[]; sede?: string | string[] }>;
}) {
  const params = await searchParams;
  const q = (Array.isArray(params?.q) ? params.q[0] : params?.q || "").trim();
  const sedeSeleccionada = Array.isArray(params?.sede) ? params.sede[0] : params?.sede || "Tienda Mercado";
  const supabase = await getSupabase();
  const { data: vendedorActual, error: vendedorError } = await supabase.rpc("vendedor_actual");
  if (vendedorError) throw new Error(vendedorError.message);
  if (!vendedorActual) throw new Error("Tu Gmail no está asociado a Papá, Mamá o Hermano.");

  const { data: sedes, error: sedesError } = await supabase
    .from("sedes")
    .select("id, nombre")
    .in("nombre", ["Almacén Central", "Tienda Mercado"])
    .eq("activa", true)
    .order("nombre");
  if (sedesError) throw new Error(sedesError.message);

  const sedeActual = sedes?.find((s) => s.nombre === sedeSeleccionada) || sedes?.[0];
  if (!sedeActual) throw new Error("No hay una sede activa disponible para registrar ventas.");

  const { data: inventarioData, error: inventarioError } = await supabase
    .from("inventario")
    .select(`
      id,
      cantidad,
      stock_minimo,
      sedes ( id, nombre ),
      productos (
        id,
        modelo,
        talla,
        color,
        activo
      )
    `)
    .eq("sede_id", sedeActual?.id || "")
    .gt("cantidad", 0);
  if (inventarioError) throw new Error(inventarioError.message);
  const inventario = inventarioData as unknown as InventarioConProducto[];

  const productosFiltrados =
    inventario.filter((item) => {
      if (!item.productos?.activo) return false;
      if (!q) return true;

      const texto = `${item.productos.modelo} ${item.productos.talla} ${item.productos.color}`.toLowerCase();
      return texto.includes(q.toLowerCase());
    });

  const { start, end } = getLimaDayBounds();
  const { data: ventasHoy, error: ventasError } = await supabase
    .from("ventas")
    .select("id, vendedor, created_at")
    .gte("created_at", start)
    .lt("created_at", end);
  if (ventasError) throw new Error(ventasError.message);

  const { data: alertasData, error: alertasError } = await supabase
    .from("inventario")
    .select("cantidad, stock_minimo, sedes ( nombre ), productos ( activo )");
  if (alertasError) throw new Error(alertasError.message);
  const stockBajo = (alertasData as unknown as Array<{
    cantidad: number;
    stock_minimo: number;
    sedes: { nombre: string } | null;
    productos: { activo: boolean } | null;
  }>).filter((item) =>
    item.sedes?.nombre === "Tienda Mercado" &&
    item.productos?.activo &&
    Number(item.cantidad) <= Number(item.stock_minimo)
  );

  return (
    <PageShell
      title="Venta rápida"
      subtitle="Busca primero dónde está el zapato. Luego registra la venta sin precio."
    >
      <div className="grid gap-4">
        <Card>
          <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Vendedor: <strong>{vendedorActual}</strong>
          </div>
          <form className="grid gap-3" action="/">
            <label className="grid gap-1">
              <span className="text-sm font-semibold">¿Dónde estás vendiendo?</span>
              <select
                name="sede"
                defaultValue={sedeSeleccionada}
                className="min-h-12 rounded-xl border p-3 text-base"
              >
                {sedes?.map((sede) => (
                  <option key={sede.id} value={sede.nombre}>
                    {sede.nombre === "Almacén Central" ? "Casa / Almacén Central" : sede.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-semibold">Buscar zapato</span>
              <input
                name="q"
                defaultValue={q}
                placeholder="Ejemplo: natacha 38 negro"
                className="min-h-12 rounded-xl border p-3 text-base"
              />
            </label>

            <button className="min-h-12 rounded-xl bg-slate-950 px-4 py-3 font-bold text-white">
              Buscar
            </button>
          </form>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card>
            <div className="text-xs text-slate-500">Ventas hoy</div>
            <div className="text-2xl font-bold">{ventasHoy?.length || 0}</div>
          </Card>
          <Card>
            <div className="text-xs text-slate-500">Resultados</div>
            <div className="text-2xl font-bold">{productosFiltrados.length}</div>
          </Card>
          <Card className={stockBajo.length ? "bg-red-50" : ""}>
            <div className="text-xs text-slate-500">Alertas</div>
            <div className="text-2xl font-bold">{stockBajo.length}</div>
          </Card>
        </div>

        <Card>
          <h2 className="mb-3 text-lg font-bold">
            Stock disponible en {sedeActual?.nombre === "Almacén Central" ? "Casa / Almacén" : sedeActual?.nombre}
          </h2>

          {productosFiltrados.length > 0 ? (
            <div className="grid gap-3">
              {productosFiltrados.map((item) => (
                <form key={item.id} action={registrarVenta} className="rounded-xl border bg-slate-50 p-3">
                  <input type="hidden" name="producto_id" value={item.productos.id} />
                  <input type="hidden" name="sede_id" value={sedeActual?.id} />

                  <div className="font-bold">{item.productos.modelo}</div>
                  <div className="text-sm text-slate-600">
                    Talla {item.productos.talla} · {item.productos.color}
                  </div>

                  <div className="mt-2 rounded-lg bg-white p-2 text-sm">
                    Stock aquí: <strong>{item.cantidad}</strong>
                  </div>

                  <div className="mt-3">
                    <label className="grid gap-1">
                      <span className="text-xs font-semibold">Cantidad</span>
                      <input
                        name="cantidad"
                        type="number"
                        min="1"
                        max={item.cantidad}
                        defaultValue="1"
                        className="min-h-11 rounded-lg border p-2 text-base"
                      />
                    </label>

                  </div>

                  <SubmitButton label="Vender" pendingLabel="Registrando..." className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white" />
                </form>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              No hay resultados con stock en esta sede. Cambia la sede o busca otro modelo/talla/color.
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
