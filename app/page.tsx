import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: sedes } = await supabase
    .from("sedes")
    .select("*")
    .order("nombre");

  const modulos = [
    { nombre: "Dashboard", href: "/dashboard" },
    { nombre: "Productos", href: "/productos" },
    { nombre: "Inventario", href: "/inventario" },
    { nombre: "Ventas", href: "/ventas" },
    { nombre: "Reportes", href: "/reportes" },
    { nombre: "Usuarios", href: "/usuarios" },
  ];

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
          {sedes?.map((sede) => (
            <div key={sede.id} className="rounded-xl bg-white p-5 shadow">
              <h2 className="text-xl font-semibold text-slate-800">
                {sede.nombre}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Tipo: {sede.tipo}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {modulos.map((modulo) => (
            <Link
              key={modulo.href}
              href={modulo.href}
              className="rounded-xl bg-slate-900 p-5 text-left text-white shadow hover:bg-slate-700"
            >
              <span className="text-lg font-semibold">{modulo.nombre}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}