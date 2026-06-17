import { revalidatePath } from "next/cache";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

async function crearProducto(formData: FormData) {
  "use server";

  const modelo = String(formData.get("modelo") || "").trim();
  const talla = String(formData.get("talla") || "").trim();
  const color = String(formData.get("color") || "").trim() || "Sin color";
  const stock = Number(formData.get("stock") || 0);

  if (!modelo || !talla) {
    throw new Error("Modelo y talla son obligatorios.");
  }

  const { data: producto, error: productoError } = await supabase
    .from("productos")
    .insert({ modelo, talla, color, activo: true })
    .select()
    .single();

  if (productoError) {
    throw new Error(productoError.message);
  }

  const { data: almacen, error: almacenError } = await supabase
    .from("sedes")
    .select("id")
    .eq("tipo", "almacen")
    .limit(1)
    .single();

  if (almacenError) {
    throw new Error("No se encontró el Almacén Central.");
  }

  const { error: inventarioError } = await supabase
    .from("inventario")
    .insert({
      sede_id: almacen.id,
      producto_id: producto.id,
      cantidad: stock,
      stock_minimo: 0,
    });

  if (inventarioError) {
    throw new Error(inventarioError.message);
  }

  revalidatePath("/productos");
}

export default async function ProductosPage() {
  const { data: productos, error } = await supabase
    .from("productos")
    .select(`
      id,
      modelo,
      talla,
      color,
      activo,
      created_at,
      inventario (
        cantidad
      )
    `)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-6">
      <section className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Productos</h1>
            <p className="text-sm text-slate-600 md:text-base">
              Registro simple: modelo, talla, color y stock inicial.
            </p>
          </div>

          <Link href="/" className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow">
            Inicio
          </Link>
        </div>

        <form action={crearProducto} className="mb-6 rounded-xl bg-white p-4 shadow md:p-5">
          <h2 className="mb-4 text-lg font-semibold md:text-xl">Nuevo producto</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium">Modelo</span>
              <input name="modelo" required placeholder="Ejemplo: Natacha escolar" className="min-h-11 rounded-lg border p-2 text-base" />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Talla</span>
              <input name="talla" required placeholder="Ejemplo: 38" className="min-h-11 rounded-lg border p-2 text-base" />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Color</span>
              <input name="color" placeholder="Ejemplo: Negro" defaultValue="Sin color" className="min-h-11 rounded-lg border p-2 text-base" />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2">
              <span className="text-sm font-medium">Stock inicial en Almacén Central</span>
              <input name="stock" type="number" min="0" defaultValue="0" className="min-h-11 rounded-lg border p-2 text-base" />
            </label>
          </div>

          <button className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-3 text-base font-semibold text-white hover:bg-slate-700 md:w-auto">
            Guardar producto
          </button>
        </form>

        {error && <div className="mb-4 rounded-xl bg-red-100 p-4 text-sm text-red-700">{error.message}</div>}

        <div className="mb-3">
          <h2 className="text-lg font-semibold">Productos registrados</h2>
        </div>

        <div className="grid gap-3 md:hidden">
          {productos && productos.length > 0 ? (
            productos.map((producto: any) => {
              const stockTotal = producto.inventario?.reduce((total: number, item: any) => total + Number(item.cantidad || 0), 0) || 0;

              return (
                <div key={producto.id} className="rounded-xl bg-white p-4 shadow">
                  <div className="text-lg font-semibold">{producto.modelo}</div>
                  <div className="mt-1 text-sm text-slate-600">Talla {producto.talla} · {producto.color}</div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span>Stock: {stockTotal}</span>
                    <span>{producto.activo ? "Activo" : "Inactivo"}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl bg-white p-4 text-slate-500 shadow">No hay productos registrados.</div>
          )}
        </div>

        <div className="hidden overflow-hidden rounded-xl bg-white shadow md:block">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-3">Modelo</th>
                <th className="p-3">Talla</th>
                <th className="p-3">Color</th>
                <th className="p-3">Stock total</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {productos && productos.length > 0 ? (
                productos.map((producto: any) => {
                  const stockTotal = producto.inventario?.reduce((total: number, item: any) => total + Number(item.cantidad || 0), 0) || 0;

                  return (
                    <tr key={producto.id} className="border-b">
                      <td className="p-3 font-medium">{producto.modelo}</td>
                      <td className="p-3">{producto.talla}</td>
                      <td className="p-3">{producto.color}</td>
                      <td className="p-3">{stockTotal}</td>
                      <td className="p-3">{producto.activo ? "Activo" : "Inactivo"}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="p-4 text-slate-500" colSpan={5}>No hay productos registrados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
