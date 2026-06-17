import Link from "next/link";

export default function ReportesPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Volver al inicio</Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Reportes</h1>
        <p className="mt-2 text-slate-600">Reportes de ventas, stock bajo y productos más vendidos.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {["Ventas por día", "Stock crítico", "Productos más vendidos"].map((item) => (
            <div key={item} className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-900">{item}</h2>
              <p className="mt-2 text-sm text-slate-500">Pendiente de conectar con la base de datos.</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
