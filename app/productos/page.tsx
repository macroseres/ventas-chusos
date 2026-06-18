import { revalidatePath } from "next/cache";
import { PageShell, Card } from "../components/Shell";
import { getSupabase } from "@/lib/supabase";
import type { ProductoConInventario } from "@/lib/types";
import { SubmitButton } from "@/app/components/SubmitButton";

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

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm font-semibold">Talla</span>
                <input name="talla" required placeholder="38" className="min-h-12 rounded-xl border p-3 text-base" />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-semibold">Color</span>
                <input name="color" defaultValue="Sin color" placeholder="Negro" className="min-h-12 rounded-xl border p-3 text-base" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1">
                <span className="text-sm font-semibold">Stock inicial</span>
                <input name="stock" type="number" min="0" defaultValue="0" className="min-h-12 rounded-xl border p-3 text-base" />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-semibold">Stock mínimo</span>
                <input name="stock_minimo" type="number" min="0" defaultValue="2" className="min-h-12 rounded-xl border p-3 text-base" />
              </label>
            </div>

            <SubmitButton label="Guardar producto" pendingLabel="Guardando..." className="min-h-12 rounded-xl bg-slate-950 px-4 py-3 font-bold text-white" />
          </form>
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
