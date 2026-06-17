import Link from "next/link";

export default function InventarioPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Volver al inicio</Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Inventario</h1>
        <p className="mt-2 text-slate-600">Stock por almacén central, tienda del mercado y tienda de casa.</p>
        <div className="mt-8 overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-4">Producto</th>
                <th className="p-4">Almacén</th>
                <th className="p-4">Mercado</th>
                <th className="p-4">Casa</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-4">Ejemplo: Bota Venus negra talla 40</td>
                <td className="p-4">10</td>
                <td className="p-4">3</td>
                <td className="p-4">2</td>
                <td className="p-4">Normal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
