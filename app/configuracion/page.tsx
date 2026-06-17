import Link from "next/link";

export default function ConfiguracionPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Volver al inicio</Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-2 text-slate-600">Configuraciones generales del sistema.</p>
      </section>
    </main>
  );
}
