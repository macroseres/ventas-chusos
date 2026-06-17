import Link from "next/link";

export default function ProductosPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Volver al inicio</Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Productos</h1>
        <p className="mt-2 text-slate-600">Registro de categorías, marcas, modelos, colores y tallas.</p>
        <div className="mt-8 rounded-xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Categorías iniciales</h2>
          <ul className="mt-4 grid gap-2 text-slate-700 md:grid-cols-2">
            <li>Zapato de caucho</li>
            <li>Sandalias</li>
            <li>Crocs</li>
            <li>Botas de caucho</li>
            <li>Zapatos de cuero</li>
            <li>Zapatillas</li>
            <li>Chimpunes</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
