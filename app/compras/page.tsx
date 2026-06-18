import { revalidatePath } from "next/cache";
import { PageShell, Card } from "../components/Shell";
import { getSupabase } from "@/lib/supabase";
import type { Compra, ProductoBase } from "@/lib/types";
import { SubmitButton } from "@/app/components/SubmitButton";
import { NumberStepper } from "@/app/components/NumberStepper";

async function registrarCompra(formData: FormData) {
  "use server";

  const producto_id = String(formData.get("producto_id") || "");
  const cantidad = Number(formData.get("cantidad") || 0);
  const observacion = String(formData.get("observacion") || "").trim();

  if (!producto_id || !Number.isInteger(cantidad) || cantidad <= 0) throw new Error("Selecciona producto y cantidad.");

  const supabase = await getSupabase();
  const { error } = await supabase.rpc("registrar_compra", {
    p_producto_id: producto_id,
    p_cantidad: cantidad,
    p_observacion: observacion,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/compras");
  revalidatePath("/inventario");
  revalidatePath("/");
  revalidatePath("/alertas");
  revalidatePath("/reportes");
}

export default async function ComprasPage() {
  const supabase = await getSupabase();
  const { data: productosData, error: productosError } = await supabase
    .from("productos")
    .select("id, modelo, talla, color, activo")
    .eq("activo", true)
    .order("modelo");
  if (productosError) throw new Error(productosError.message);
  const productos = productosData as unknown as ProductoBase[];

  const { data: comprasData, error: comprasError } = await supabase
    .from("compras")
    .select(`
      id,
      cantidad,
      observacion,
      created_at,
      productos ( modelo, talla, color )
    `)
    .order("created_at", { ascending: false })
    .limit(20);
  if (comprasError) throw new Error(comprasError.message);
  const compras = comprasData as unknown as Compra[];

  return (
    <PageShell title="Compras" subtitle="Ingreso de mercadería a Casa / Almacén Central.">
      <div className="grid gap-4">
        <Card>
          <form action={registrarCompra} className="grid gap-4">
            <h2 className="text-lg font-bold">Nuevo ingreso</h2>

            <label className="grid gap-1">
              <span className="text-sm font-semibold">Producto</span>
              <select name="producto_id" required className="min-h-12 rounded-xl border p-3 text-base">
                <option value="">Seleccionar producto</option>
                {productos.map((producto) => (
                  <option key={producto.id} value={producto.id}>
                    {producto.modelo} · Talla {producto.talla} · {producto.color}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-1">
              <span className="text-sm font-semibold">Cantidad recibida</span>
              <NumberStepper name="cantidad" min={1} defaultValue={1} required />
            </div>

            <label className="grid gap-1">
              <span className="text-sm font-semibold">Observación</span>
              <input name="observacion" placeholder="Ejemplo: compra recibida por hermano" className="min-h-12 rounded-xl border p-3 text-base" />
            </label>

            <SubmitButton label="Guardar ingreso" pendingLabel="Guardando..." className="min-h-12 rounded-xl bg-slate-950 px-4 py-3 font-bold text-white" />
          </form>
        </Card>

        <div className="grid gap-3">
          {compras.length > 0 ? compras.map((compra) => (
            <Card key={compra.id}>
              <div className="font-bold">{compra.productos?.modelo}</div>
              <div className="text-sm text-slate-600">
                Talla {compra.productos?.talla} · {compra.productos?.color}
              </div>
              <div className="mt-2 text-sm">Cantidad: <strong>{compra.cantidad}</strong></div>
              {compra.observacion && <div className="text-sm text-slate-600">{compra.observacion}</div>}
            </Card>
          )) : (
            <Card className="text-slate-500">No hay compras registradas.</Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
