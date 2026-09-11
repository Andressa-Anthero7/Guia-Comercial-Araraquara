import { FormEvent, useState } from "react";
import "./advertiser-workspace.css";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Store } from "lucide-react";

interface AdvertiserLoginProps {
  notice?: string;
  onLogin: (username: string, password: string) => Promise<void>;
  onExit: () => void;
}

export function AdvertiserLogin({ onLogin, onExit, notice }: AdvertiserLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
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
    <main className="advertiser-login flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-md border border-slate-300 bg-white p-7 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-slate-950 text-amber-400"><Store className="h-6 w-6" /></div>
        <p className="workspace-login-brand">GUIA COMERCIAL ARARAQUARA</p>
        <h1 className="mt-5 text-2xl font-extrabold text-slate-950">Seu negócio começa aqui.</h1>
        <p className="mt-2 text-sm text-slate-500">Entre na Área do Anunciante para cuidar da sua página, dos seus anúncios e das suas oportunidades.</p>
        {notice && <p role="alert" className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{notice}</p>}
        <form className="mt-6 space-y-4" onSubmit={(event) => void submit(event)}>
          <label className="block text-sm font-semibold text-slate-700">Usuario
            <input autoComplete="username" className="mt-1.5 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label className="block text-sm font-semibold text-slate-700">Senha
            <span className="relative mt-1.5 block"><input type={showPassword ? "text" : "password"} autoComplete="current-password" className="h-11 w-full rounded-md border border-slate-300 py-2 pl-3 pr-11 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" title={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-900" onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></span>
          </label>
          {error && <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}
          <button disabled={isSubmitting} className="h-11 w-full rounded-md bg-slate-950 px-4 font-bold text-white disabled:opacity-60">{isSubmitting ? "Entrando..." : "Entrar"}</button>
        </form>
        <button type="button" onClick={onExit} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4" />Voltar ao guia</button>
      </section>
    </main>
  );
}
