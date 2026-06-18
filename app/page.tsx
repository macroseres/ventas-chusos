import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { Card, PageShell } from "@/app/components/Shell";

const SEDES = ["Tienda Mercado", "Almacén Central"];

function normalizar(valor: string) {
  return valor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function stockEnSede(producto: any, sede: string) {
  const item = producto.inventario?.find((registro: any) => registro.sedes?.nombre === sede);
  return Number(item?.cantidad || 0);
}

async function registrarVentaRapida(formData: FormData) {
  "use server";

  const sede_nombre = String(formData.get("sede_nombre") || "Tienda Mercado");
  const producto_id = String(formData.get("producto_id") || "");
  const cantidad = Number(formData.get("cantidad") || 0);
  const precio_unitario = Number(formData.get("precio_unitario") || 0);
  const metodo_pago = String(formData.get("metodo_pago") || "efectivo");
  const vendedor = String(formData.get("vendedor") || "");

  if (!producto_id || cantidad <= 0) throw new Error("Selecciona producto y cantidad válida.");

  const { data: sede } = await supabase.from("sedes").select("id").eq("nombre", sede_nombre).single();
  if (!sede) throw new Error("No se encontró la sede seleccionada.");

  const { data: stock } = await supabase
    .from("inventario")
    .select("id, cantidad")
    .eq("sede_id", sede.id)
    .eq("producto_id", producto_id)
    .single();

  if (!stock) throw new Error(`No hay inventario en ${sede_nombre} para este producto.`);
  if (Number(stock.cantidad) < cantidad) throw new Error(`Stock insuficiente en ${sede_nombre}.`);

  const total = cantidad * precio_unitario;

  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert({ sede_id: sede.id, total, metodo_pago, vendedor })
    .select()
    .single();

  if (ventaError) throw new Error(ventaError.message);

  const { error: detalleError } = await supabase
    .from("detalle_ventas")
    .insert({ venta_id: venta.id, producto_id, cantidad, precio_unitario });

  if (detalleError) throw new Error(detalleError.message);

  const { error: invError } = await supabase
    .from("inventario")
    .update({ cantidad: Number(stock.cantidad) - cantidad })
    .eq("id", stock.id);

  if (invError) throw new Error(invError.message);

  revalidatePath("/");
  revalidatePath("/ventas");
  revalidatePath("/inventario");
  revalidatePath("/reportes");
  revalidatePath("/alertas");
}

export default async function Home(props: any) {
  const searchParams = await props.searchParams;
  const sede = SEDES.includes(searchParams?.sede) ? searchParams.sede : "Tienda Mercado";
  const q = String(searchParams?.q || "").trim();

  const { data: productos } = await supabase
    .from("productos")
    .select(`id, modelo, talla, color, activo, inventario (id, cantidad, sedes (nombre))`)
    .eq("activo", true)
    .order("modelo");

  const { data: ventasHoy } = await supabase
    .from("ventas")
    .select("id, total, vendedor, created_at")
    .gte("created_at", new Date(new Date().setHours(0,0,0,0)).toISOString());

  const lista = productos || [];
  const filtrados = q
    ? lista.filter((p: any) => normalizar(`${p.modelo} ${p.talla} ${p.color}`).includes(normalizar(q)))
    : lista.slice(0, 20);

  const disponibles = filtrados.filter((p: any) => stockEnSede(p, sede) > 0);
  const totalVendido = ventasHoy?.reduce((acc: number, v: any) => acc + Number(v.total || 0), 0) || 0;

  return (
    <PageShell title="Venta rápida" subtitle="Busca el zapato, verifica dónde está y registra la venta desde el celular.">
      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="space-y-4">
          <Card>
            <form className="grid gap-3" action="/" method="get">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Estoy vendiendo en</span>
                <select name="sede" defaultValue={sede} className="min-h-12 rounded-xl border p-3 text-base">
                  <option value="Tienda Mercado">Tienda Mercado</option>
                  <option value="Almacén Central">Casa / Almacén Central</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Buscar antes de vender</span>
                <input name="q" defaultValue={q} placeholder="Modelo, talla o color" className="min-h-12 rounded-xl border p-3 text-base" />
              </label>

              <button className="min-h-12 rounded-xl bg-slate-950 px-4 py-3 font-bold text-white">Buscar stock</button>
            </form>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Resultado de búsqueda</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{sede}</span>
            </div>

            <div className="grid gap-2">
              {filtrados.length > 0 ? filtrados.slice(0, 8).map((p: any) => {
                const stockMercado = stockEnSede(p, "Tienda Mercado");
                const stockAlmacen = stockEnSede(p, "Almacén Central");
                return (
                  <div key={p.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="font-semibold">{p.modelo}</div>
                    <div className="text-sm text-slate-600">Talla {p.talla} · {p.color}</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-center text-sm">
                      <div className="rounded-lg bg-white p-2">Mercado: <strong>{stockMercado}</strong></div>
                      <div className="rounded-lg bg-white p-2">Casa: <strong>{stockAlmacen}</strong></div>
                    </div>
                  </div>
                );
              }) : <div className="text-sm text-slate-500">No se encontraron productos.</div>}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-2 border-slate-950">
            <h2 className="mb-3 text-lg font-bold">Registrar venta</h2>
            <form action={registrarVentaRapida} className="grid gap-3">
              <input type="hidden" name="sede_nombre" value={sede} />

              <label className="flex flex-col gap-1">
                <span className="text-sm font-semibold">Producto con stock en {sede}</span>
                <select name="producto_id" required className="min-h-12 rounded-xl border p-3 text-base">
                  <option value="">Seleccionar producto</option>
                  {disponibles.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.modelo} · Talla {p.talla} · {p.color} · Stock: {stockEnSede(p, sede)}</option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">Cantidad</span>
                  <input name="cantidad" type="number" min="1" defaultValue="1" required className="min-h-12 rounded-xl border p-3 text-base" />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">Precio</span>
                  <input name="precio_unitario" type="number" min="0" step="0.01" required placeholder="S/" className="min-h-12 rounded-xl border p-3 text-base" />
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

              <button className="mt-1 min-h-14 rounded-xl bg-amber-400 px-4 py-3 text-lg font-extrabold text-slate-950 shadow hover:bg-amber-300">Vender ahora</button>
            </form>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card><div className="text-xs text-slate-500">Ventas hoy</div><div className="text-2xl font-bold">{ventasHoy?.length || 0}</div></Card>
            <Card><div className="text-xs text-slate-500">Total hoy</div><div className="text-2xl font-bold">S/ {totalVendido.toFixed(2)}</div></Card>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
