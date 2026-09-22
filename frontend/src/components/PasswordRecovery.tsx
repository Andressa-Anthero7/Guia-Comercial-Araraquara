import { useState, type FormEvent } from "react";
import { ensureCsrf, request } from "../api";

export function PasswordRecovery({ onBack }: { onBack: () => void }) {
  const params = new URLSearchParams(window.location.search);
  const reset = params.has("uid") && params.has("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (reset && password !== confirmation) { setError("As senhas devem ser iguais."); return; }
    setBusy(true);
    try {
      await ensureCsrf();
      const response = await request<{ detail: string }>(`/api/auth/password-reset/${reset ? "confirm/" : ""}`, {
        method: "POST", body: JSON.stringify(reset ? { uid: params.get("uid"), token: params.get("token"), password } : { email })
      });
      setNotice(response.detail);
      setPassword("");
      setConfirmation("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível concluir."); }
    finally { setBusy(false); }
  }
  const input = "mt-2 block h-11 w-full rounded-md border border-slate-300 px-3";
  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4"><section className="w-full max-w-md border border-slate-300 bg-white p-7 shadow-xl">
    <h1 className="text-2xl font-bold">{reset ? "Definir nova senha" : "Recuperar acesso"}</h1>
    <p className="mt-2 text-sm text-slate-500">{reset ? "Escolha uma senha com pelo menos 8 caracteres." : "Informe o e-mail da sua conta de anunciante."}</p>
    {notice ? <p role="status" className="mt-5 text-sm text-emerald-700">{notice}</p> : <form onSubmit={event => void submit(event)} className="mt-5 space-y-4">
      {reset ? <><label className="block text-sm font-semibold">Nova senha<input className={input} type="password" minLength={8} maxLength={256} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><label className="block text-sm font-semibold">Confirmar senha<input className={input} type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label></> : <label className="block text-sm font-semibold">E-mail<input className={input} type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <button disabled={busy} className="h-11 w-full rounded-md bg-slate-950 font-bold text-white disabled:opacity-60">{busy ? "Aguarde..." : reset ? "Salvar nova senha" : "Enviar link"}</button>
    </form>}
    <button type="button" onClick={() => { history.replaceState({}, "", "/anunciante/"); onBack(); }} className="mt-5 text-sm font-semibold text-slate-600">Voltar ao login</button>
  </section></main>;
}
