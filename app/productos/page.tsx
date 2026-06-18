import { revalidatePath } from "next/cache";
import { PageShell, Card } from "../components/Shell";
import { getSupabase } from "@/lib/supabase";
import type { ProductoConInventario } from "@/lib/types";
import { SubmitButton } from "@/app/components/SubmitButton";
import type { ColorCatalogo } from "@/lib/types";
import { NumberStepper } from "@/app/components/NumberStepper";

async function crearColor(formData: FormData) {
  "use server";

  const nombre = String(formData.get("nombre") || "").trim();
  const hex = String(formData.get("hex") || "").trim();
  if (!nombre || !/^#[0-9a-f]{6}$/i.test(hex)) throw new Error("Indica un nombre y un color válido.");

  const supabase = await getSupabase();
  const { error } = await supabase.rpc("crear_color", { p_nombre: nombre, p_hex: hex });
  if (error) throw new Error(error.message);
  revalidatePath("/productos");
}

async function crearProducto(formData: FormData) {
  "use server";

  const modelo = String(formData.get("modelo") || "").trim();
  const talla = String(formData.get("talla") || "").trim();
  const color = String(formData.get("color") || "").trim() || "Sin color";
  const stock = Number(formData.get("stock") || 0);
  const stock_minimo = Number(formData.get("stock_minimo") || 0);

  if (!modelo || !talla || !Number.isInteger(stock) || !Number.isInteger(stock_minimo) || stock < 0 || stock_minimo < 0) {
    throw new Error("Revisa modelo, talla y cantidades.");
  }

  const supabase = await getSupabase();
  const { error } = await supabase.rpc("crear_producto_con_stock", {
    p_modelo: modelo,
    p_talla: talla,
    p_color: color,
    p_stock: stock,
    p_stock_minimo: stock_minimo,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/productos");
  revalidatePath("/");
  revalidatePath("/inventario");
}

export default async function ProductosPage() {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("productos")
    .select(`
      id,
      modelo,
      talla,
      color,
      activo,
      inventario (
        cantidad,
        stock_minimo,
        sedes ( nombre )
      )
    `)
    .order("modelo");
  const productos = (data || []) as unknown as ProductoConInventario[];

  const { data: coloresData, error: coloresError } = await supabase
    .from("colores")
    .select("id, nombre, hex, activo")
    .eq("activo", true)
    .order("nombre");
  if (coloresError) throw new Error(coloresError.message);
  const colores = coloresData as unknown as ColorCatalogo[];

  return (
    <PageShell title="Productos" subtitle="Registra modelo, talla, color y stock inicial.">
      <div className="grid gap-4">
        <Card>
          <form action={crearProducto} className="grid gap-4">
            <h2 className="text-lg font-bold">Nuevo producto</h2>

            <label className="grid gap-1">
              <span className="text-sm font-semibold">Modelo</span>
              <input name="modelo" required placeholder="Ejemplo: Natacha escolar" className="min-h-12 rounded-xl border p-3 text-base" />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid min-w-0 gap-1">
                <span className="text-sm font-semibold">Talla</span>
                <input name="talla" required placeholder="38" className="min-h-12 min-w-0 rounded-xl border p-3 text-base" />
              </label>

              <label className="grid min-w-0 gap-1">
                <span className="text-sm font-semibold">Color</span>
                <select name="color" required defaultValue="" className="min-h-12 min-w-0 rounded-xl border p-3 text-base">
                  <option value="" disabled>Seleccionar</option>
                  {colores.map((color) => <option key={color.id} value={color.nombre}>{color.nombre}</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid min-w-0 gap-1">
                <span className="text-sm font-semibold">Stock inicial</span>
                <NumberStepper name="stock" min={0} defaultValue={0} />
              </div>

              <div className="grid min-w-0 gap-1">
                <span className="text-sm font-semibold">Stock mínimo</span>
                <NumberStepper name="stock_minimo" min={0} defaultValue={2} />
              </div>
            </div>

            <SubmitButton label="Guardar producto" pendingLabel="Guardando..." className="min-h-12 rounded-xl bg-slate-950 px-4 py-3 font-bold text-white" />
          </form>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">Colores disponibles</h2>
          <form action={crearColor} className="mt-3 hidden gap-3 md:grid md:grid-cols-[1fr_auto_auto] md:items-end">
            <label className="grid gap-1">
              <span className="text-sm font-semibold">Nuevo color</span>
              <input name="nombre" required placeholder="Ejemplo: Vino" className="min-h-12 min-w-0 rounded-xl border p-3 text-base" />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-semibold">Muestra</span>
              <input name="hex" type="color" defaultValue="#111111" className="h-12 w-full min-w-20 rounded-xl border bg-white p-1 sm:w-20" />
            </label>
            <SubmitButton label="Añadir color" pendingLabel="Añadiendo..." className="min-h-12 rounded-xl bg-slate-700 px-4 font-bold text-white" />
          </form>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Colores disponibles">
            {colores.map((color) => (
              <span key={color.id} className="inline-flex items-center gap-2 rounded-lg border bg-slate-50 px-2 py-1 text-sm">
                <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: color.hex }} />
                {color.nombre}
              </span>
            ))}
          </div>
        </Card>

        {error && <Card className="bg-red-50 text-red-700">{error.message}</Card>}

        <div className="grid gap-3">
          {productos.map((producto) => {
            const total = producto.inventario?.reduce((sum, item) => sum + Number(item.cantidad || 0), 0) || 0;

            return (
              <Card key={producto.id}>
                <div className="font-bold">{producto.modelo}</div>
                <div className="text-sm text-slate-600">
                  Talla {producto.talla} · {producto.color}
                </div>
                <div className="mt-2 text-sm">
                  Stock total: <strong>{total}</strong>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
