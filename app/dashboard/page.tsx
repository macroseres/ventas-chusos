import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Volver al inicio</Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-2 text-slate-600">Resumen general de ventas, stock y movimientos.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {["Ventas del día", "Stock total", "Stock bajo", "Últimas ventas"].map((item) => (
            <div key={item} className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{item}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
