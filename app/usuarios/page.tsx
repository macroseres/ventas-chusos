import Link from "next/link";

export default function UsuariosPage() {
  const usuarios = [
    { nombre: "Papá", permisos: "Ventas, ingreso de stock y traslados" },
    { nombre: "Mamá", permisos: "Ventas" },
    { nombre: "Hermano", permisos: "Ventas, ingreso de stock y traslados" },
    { nombre: "Admin", permisos: "Acceso total" },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">← Volver al inicio</Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Usuarios</h1>
        <p className="mt-2 text-slate-600">Roles iniciales del sistema.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {usuarios.map((usuario) => (
            <div key={usuario.nombre} className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">{usuario.nombre}</h2>
              <p className="mt-2 text-sm text-slate-500">{usuario.permisos}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
