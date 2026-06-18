import { loginWithGoogle } from "./actions";
import { SubmitButton } from "@/app/components/SubmitButton";
import { Brand } from "@/app/components/Brand";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  const errorCode = Array.isArray(error) ? error[0] : error;
  const message = errorCode === "unauthorized"
    ? "Esta cuenta de Google no está autorizada."
    : errorCode === "configuration"
      ? "El acceso no está configurado correctamente. Revisa la migración y vuelve a intentar."
    : errorCode
      ? "No se pudo iniciar sesión con Google."
      : null;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4 text-slate-950">
      <form action={loginWithGoogle} className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
        <Brand />
        <h1 className="mt-1 text-2xl font-bold">Iniciar sesión</h1>
        <div className="mt-6 grid gap-4">
          {message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}
          <SubmitButton
            label="Continuar con Google"
            pendingLabel="Abriendo Google..."
            className="min-h-12 rounded-lg border border-slate-300 bg-white px-4 font-bold text-slate-900 hover:bg-slate-50"
          />
        </div>
      </form>
    </main>
  );
}
