import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { Card, PageShell } from "@/app/components/Shell";

async function crearProducto(formData: FormData) {
  "use server";
  const modelo = String(formData.get("modelo") || "").trim();
  const talla = String(formData.get("talla") || "").trim();
  const color = String(formData.get("color") || "").trim() || "Sin color";
  const stock = Number(formData.get("stock") || 0);
  if (!modelo || !talla) throw new Error("Modelo y talla son obligatorios.");

  const { data: producto, error } = await supabase.from("productos").insert({ modelo, talla, color, activo: true }).select().single();
  if (error) throw new Error(error.message);

  const { data: almacen } = await supabase.from("sedes").select("id").eq("nombre", "Almacén Central").single();
  if (!almacen) throw new Error("No se encontró Almacén Central.");

  const { error: invError } = await supabase.from("inventario").insert({ sede_id: almacen.id, producto_id: producto.id, cantidad: stock, stock_minimo: 0 });
  if (invError) throw new Error(invError.message);

  revalidatePath("/productos");
  revalidatePath("/");
  revalidatePath("/inventario");
}

export default async function ProductosPage() {
  const { data: productos } = await supabase
    .from("productos")
    .select(`id, modelo, talla, color, activo, created_at, inventario (cantidad, sedes (nombre))`)
    .order("created_at", { ascending: false });

  return (
    <PageShell title="Productos" subtitle="Carga rápida de modelo, talla, color y stock inicial en casa/almacén.">
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="mb-3 text-lg font-bold">Nuevo producto</h2>
          <form action={crearProducto} className="grid gap-3">
            <input name="modelo" required placeholder="Modelo: Natacha escolar" className="min-h-12 rounded-xl border p-3 text-base" />
            <div className="grid grid-cols-2 gap-3">
              <input name="talla" required placeholder="Talla" className="min-h-12 rounded-xl border p-3 text-base" />
              <input name="color" defaultValue="Sin color" placeholder="Color" className="min-h-12 rounded-xl border p-3 text-base" />
            </div>
            <input name="stock" type="number" min="0" defaultValue="0" placeholder="Stock inicial" className="min-h-12 rounded-xl border p-3 text-base" />
            <button className="min-h-12 rounded-xl bg-slate-950 font-bold text-white">Guardar</button>
          </form>
        </Card>

        <div className="grid gap-3">
          {(productos || []).map((p: any) => {
            const total = p.inventario?.reduce((a: number, i: any) => a + Number(i.cantidad || 0), 0) || 0;
            return <Card key={p.id}><div className="flex justify-between gap-3"><div><div className="font-bold">{p.modelo}</div><div className="text-sm text-slate-600">Talla {p.talla} · {p.color}</div></div><div className="rounded-xl bg-slate-950 px-3 py-2 text-center text-white"><div className="text-xs">Stock</div><div className="text-xl font-bold">{total}</div></div></div></Card>
          })}
          {(!productos || productos.length === 0) && <Card><div className="text-slate-500">No hay productos registrados.</div></Card>}
        </div>
      </div>
    </PageShell>
  );
}
