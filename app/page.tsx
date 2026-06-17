export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-slate-900">
          Sistema de Ventas Chusos
        </h1>

        <p className="mt-2 text-slate-600">
          Gestión de ventas, inventario y stock para almacén, mercado y casa.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Almacén central",
            "Tienda 1 - Mercado",
            "Tienda 2 - Casa",
          ].map((sede) => (
            <div key={sede} className="rounded-xl bg-white p-5 shadow">
              <h2 className="text-xl font-semibold text-slate-800">{sede}</h2>
              <p className="mt-2 text-sm text-slate-500">
                Consultar stock, movimientos y ventas asociadas.
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            "Productos",
            "Inventario",
            "Ventas",
            "Movimientos",
            "Usuarios",
            "Reportes",
          ].map((modulo) => (
            <button
              key={modulo}
              className="rounded-xl bg-slate-900 p-5 text-left text-white shadow hover:bg-slate-700"
            >
              <span className="text-lg font-semibold">{modulo}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}