import Link from "next/link";

export default function VentasPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Volver al inicio</Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Ventas</h1>
        <p className="mt-2 text-slate-600">Formulario inicial para registrar ventas.</p>
        <form className="mt-8 grid gap-4 rounded-xl bg-white p-5 shadow-sm">
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Producto" />
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Talla" />
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Cantidad" />
          <input className="rounded-lg border border-slate-300 p-3" placeholder="Precio de venta" />
          <select className="rounded-lg border border-slate-300 p-3" defaultValue="">
            <option value="" disabled>Sede de venta</option>
            <option>Tienda 1 - Mercado</option>
            <option>Tienda 2 - Casa</option>
          </select>
          <button type="button" className="rounded-lg bg-slate-900 p-3 font-semibold text-white hover:bg-slate-700">
            Guardar venta
          </button>
        </form>
      </section>
    </main>
  );
}
