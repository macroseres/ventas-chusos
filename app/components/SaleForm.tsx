"use client";

import { useActionState } from "react";
import { NumberStepper } from "@/app/components/NumberStepper";
import { SubmitButton } from "@/app/components/SubmitButton";

export type SaleState = { error?: string; success?: string } | null;

export function SaleForm({
  action,
  producto,
  sedeId,
  sellerReady,
}: {
  action: (state: SaleState, formData: FormData) => Promise<SaleState>;
  producto: { id: string; modelo: string; talla: string; color: string; cantidad: number };
  sedeId: string;
  sellerReady: boolean;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <form action={formAction} className="rounded-xl border bg-slate-50 p-3">
      <input type="hidden" name="producto_id" value={producto.id} />
      <input type="hidden" name="sede_id" value={sedeId} />
      <div className="font-bold">{producto.modelo}</div>
      <div className="text-sm text-slate-600">Talla {producto.talla} · {producto.color}</div>
      <div className="mt-2 rounded-lg bg-white p-2 text-sm">Stock aquí: <strong>{producto.cantidad}</strong></div>
      <div className="mt-3 grid gap-1">
        <span className="text-xs font-semibold">Cantidad</span>
        <NumberStepper name="cantidad" min={1} max={producto.cantidad} defaultValue={1} required />
      </div>
      {state?.error && <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{state.error}</p>}
      {state?.success && <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800">{state.success}</p>}
      <SubmitButton
        label={sellerReady ? "Vender" : "Asocia este Gmail para vender"}
        pendingLabel="Registrando..."
        disabled={!sellerReady}
        className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-3 font-bold text-white"
      />
    </form>
  );
}
