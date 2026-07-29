import { FormEvent, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole } from "lucide-react";

interface BackofficeLoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onExit: () => void;
}

export function BackofficeLogin({ onLogin, onExit }: BackofficeLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await onLogin(username, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel entrar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-7 shadow-xl">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-900 text-amber-400">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-stone-950">Acesso ao backoffice</h1>
        <p className="mt-2 text-sm text-stone-500">
          Entre com o usuario administrativo do Guia Comercial.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-stone-700">
            Usuario
            <input
              autoComplete="username"
              className="mt-1.5 w-full rounded-lg border border-stone-300 px-3 py-2.5 outline-none focus:border-amber-500"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-semibold text-stone-700">
            Senha
            <span className="relative mt-1.5 block">
              <input
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                className="w-full rounded-lg border border-stone-300 py-2.5 pl-3 pr-11 outline-none focus:border-amber-500"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-500 transition hover:text-stone-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500"
                onClick={() => setIsPasswordVisible((visible) => !visible)}
                aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                aria-pressed={isPasswordVisible}
                title={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
              >
                {isPasswordVisible ? (
                  <EyeOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Eye className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </span>
          </label>
          {error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-stone-900 px-4 py-3 font-bold text-white disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          onClick={onExit}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-stone-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao portal
        </button>
      </div>
    </div>
  );
}
