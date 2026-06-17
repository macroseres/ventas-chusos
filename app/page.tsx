import Link from "next/link";

const sedes = [
  { nombre: "Almacén central", descripcion: "Ingreso de productos y control general de stock." },
  { nombre: "Tienda 1 - Mercado", descripcion: "Ventas realizadas en el mercado." },
  { nombre: "Tienda 2 - Casa", descripcion: "Ventas realizadas desde casa." },
];

const modulos = [
  { href: "/dashboard", titulo: "Dashboard", descripcion: "Resumen general del negocio." },
  { href: "/productos", titulo: "Productos", descripcion: "Categorías, marcas, modelos, tallas y colores." },
  { href: "/inventario", titulo: "Inventario", descripcion: "Stock por sede y alertas de stock bajo." },
  { href: "/ventas", titulo: "Ventas", descripcion: "Registro rápido de ventas desde celular." },
  { href: "/reportes", titulo: "Reportes", descripcion: "Ventas, productos más vendidos y stock crítico." },
  { href: "/usuarios", titulo: "Usuarios", descripcion: "Papá, mamá, hermano y administrador." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Sistema propio de ventas
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Sistema de Ventas Chusos
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Gestión de ventas, inventario y movimientos entre almacén central,
            tienda del mercado y tienda de casa.
          </p>
        </div>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Sedes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {sedes.map((sede) => (
            <div key={sede.nombre} className="rounded-xl bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800">{sede.nombre}</h3>
              <p className="mt-2 text-sm text-slate-500">{sede.descripcion}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-8 text-xl font-semibold text-slate-900">Módulos</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {modulos.map((modulo) => (
            <Link
              key={modulo.href}
              href={modulo.href}
              className="rounded-xl bg-slate-900 p-5 text-white shadow-sm transition hover:bg-slate-700"
            >
              <span className="text-lg font-semibold">{modulo.titulo}</span>
              <p className="mt-2 text-sm text-slate-300">{modulo.descripcion}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
