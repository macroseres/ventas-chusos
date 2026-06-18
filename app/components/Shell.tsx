import Link from "next/link";
import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import { SubmitButton } from "@/app/components/SubmitButton";

const navItems = [
  { href: "/", label: "Venta" },
  { href: "/inventario", label: "Stock" },
  { href: "/movimientos", label: "Mover" },
  { href: "/compras", label: "Compra" },
  { href: "/alertas", label: "Alertas" },
  { href: "/productos", label: "Productos" },
  { href: "/reportes", label: "Reportes" },
];

export function AppHeader({ title, subtitle, userEmail }: { title: string; subtitle?: string; userEmail?: string }) {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 border-b border-slate-800 bg-slate-950 px-4 py-3 text-white shadow md:-mx-6 md:px-6 md:py-4">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-300">
            Chusos
          </div>
          <h1 className="text-lg font-bold leading-tight md:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-xs text-slate-300 md:text-base">{subtitle}</p>}
        </div>
        <form action={logout}>
          <div title={`Cerrar sesión${userEmail ? ` de ${userEmail}` : ""}`}>
            <SubmitButton label="Salir" pendingLabel="Saliendo..." className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold hover:bg-slate-800" />
          </div>
        </form>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-4px_18px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-semibold text-slate-700">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-xl px-1 py-2 hover:bg-slate-100">
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function DesktopNav() {
  return (
    <div className="mb-5 hidden flex-wrap gap-2 md:flex">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow hover:bg-slate-50">
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export async function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { user } = await requireSession();

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 p-4 pb-40 text-slate-900 md:p-6 md:pb-6">
      <AppHeader title={title} subtitle={subtitle} userEmail={user.email} />
      <section className="mx-auto max-w-6xl">
        <DesktopNav />
        {children}
      </section>
      <BottomNav />
    </main>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white p-4 shadow ${className}`}>{children}</div>;
}
