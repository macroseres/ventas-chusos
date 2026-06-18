export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-2" aria-label="Zapatería López">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-black ${inverse ? "bg-amber-300 text-slate-950" : "bg-slate-950 text-amber-300"}`}>
        ZL
      </span>
      <span className={`text-sm font-bold ${inverse ? "text-white" : "text-slate-950"}`}>
        Zapatería López
      </span>
    </div>
  );
}
