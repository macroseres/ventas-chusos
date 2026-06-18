"use client";

import { useRef } from "react";

export function NumberStepper({
  name,
  min = 0,
  max,
  defaultValue = 0,
  required = false,
}: {
  name: string;
  min?: number;
  max?: number;
  defaultValue?: number;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function adjust(direction: "down" | "up") {
    const input = inputRef.current;
    if (!input) return;
    if (direction === "up") input.stepUp();
    else input.stepDown();
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_3rem_3rem] gap-2">
      <input
        ref={inputRef}
        name={name}
        type="number"
        min={min}
        max={max}
        step="1"
        defaultValue={defaultValue}
        required={required}
        className="number-stepper-input min-h-12 min-w-0 rounded-lg border p-3 text-base"
      />
      <button
        type="button"
        onClick={() => adjust("down")}
        aria-label={`Disminuir ${name}`}
        title="Disminuir"
        className="grid h-12 w-12 place-items-center rounded-lg border border-slate-300 bg-slate-100 text-2xl font-bold text-slate-900 hover:bg-slate-200 active:bg-slate-300"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => adjust("up")}
        aria-label={`Aumentar ${name}`}
        title="Aumentar"
        className="grid h-12 w-12 place-items-center rounded-lg bg-slate-950 text-2xl font-bold text-white hover:bg-slate-800 active:bg-slate-700"
      >
        +
      </button>
    </div>
  );
}
