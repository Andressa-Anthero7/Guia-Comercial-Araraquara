import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import { AdvertiserPortalData, AuthenticationError, loadAdvertiserPortal } from "../api";
import { AdvertiserOverview, AdvertiserWorkspace, WorkspaceEmpty, todayInAraraquara } from "./AdvertiserWorkspace";
import { ProfileSection } from "./advertiser/ProfileSection";
import { BusinessesSection } from "./advertiser/BusinessesSection";
import { AdsSection } from "./advertiser/AdsSection";
import { CouponsSection } from "./advertiser/CouponsSection";
import { FinanceSection } from "./advertiser/FinanceSection";
import { useAdvertiserNavigation } from "./advertiser/useAdvertiserNavigation";

export function AdvertiserPortal({ onLogout, onSessionExpired }: { onLogout: () => Promise<void>; onSessionExpired: () => void }) {
  const [data, setData] = useState<AdvertiserPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [reset, setReset] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const busy = useRef(false);
  const request = useRef(0);
  const reportDirty = useCallback((value: boolean) => setDirty(value), []);
  const canLeave = () => !busy.current && (!dirty || window.confirm("Você tem alterações não salvas. Descartar as alterações e continuar?"));
  const clearEditor = () => { setDirty(false); setReset(value => value + 1); setNotice(""); setError(""); };
  const { tab, navigate } = useAdvertiserNavigation(canLeave, clearEditor);
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);
  const reload = async () => {
    const id = ++request.current;
    setLoading(true); setError("");
    try {
      const portal = await loadAdvertiserPortal();
      if (id !== request.current) return false;
      setData(portal);
      return true;
    } catch (reason) {
      if (id !== request.current) return false;
      if (reason instanceof AuthenticationError) onSessionExpired();
      else setError(reason instanceof Error ? reason.message : "Não foi possível carregar os dados. Tente novamente.");
      return false;
    } finally { if (id === request.current) setLoading(false); }
  };
  useEffect(() => { void reload(); return () => { request.current++; }; }, []);
  const save = async (action: () => Promise<unknown>, message: string) => {
    if (busy.current) return false;
    busy.current = true; setSaving(true); setError(""); setNotice("");
    try {
      await action();
      setDirty(false);
      const refreshed = await reload();
      setNotice(refreshed ? message : "Alterações salvas. A atualização da lista falhou; use Atualizar para consultar os dados atuais.");
      return true;
    } catch (reason) {
      if (reason instanceof AuthenticationError) onSessionExpired();
      else setError(reason instanceof Error ? reason.message : "Não foi possível salvar. Seus dados preenchidos foram mantidos.");
      return false;
    } finally { busy.current = false; setSaving(false); }
  };
  const logout = async () => {
    if (!canLeave()) return;
    busy.current = true; setSaving(true); setLeaving(true); setError("");
    try { await onLogout(); } catch (reason) {
      if (reason instanceof AuthenticationError) onSessionExpired();
      else setError(reason instanceof Error ? reason.message : "Não foi possível sair. Tente novamente.");
    } finally { busy.current = false; setSaving(false); setLeaving(false); }
  };
  if (!data) return <main className="advertiser-loading"><RefreshCw size={24} className={loading ? "animate-spin" : ""} /><p role={loading ? "status" : "alert"}>{loading ? "Carregando a área do anunciante…" : error}</p>{!loading && <button className="workspace-secondary" onClick={() => void reload()}>Tentar novamente</button>}</main>;
  const open = data.invoices.filter(item => item.status === "open" || item.status === "overdue");
  const editorProps = { saving, onSave: save, onDirtyChange: reportDirty };
  return <AdvertiserWorkspace data={data} tab={tab} onTab={navigate} onLogout={() => void logout()} onRefresh={() => { if (canLeave()) { clearEditor(); void reload(); } }} loading={loading} saving={saving} busyMessage={leaving ? "Encerrando sessão…" : "Salvando alterações…"} error={error} notice={notice}>
    <div key={`${tab}-${reset}`}>
      {tab === "overview" && <AdvertiserOverview data={data} onTab={navigate} openAmount={open.reduce((total, item) => total + Number(item.total), 0)} overdueCount={open.filter(item => item.status === "overdue" || item.due_date < todayInAraraquara()).length} />}
      {tab === "profile" && <ProfileSection data={data} {...editorProps} />}
      {tab === "businesses" && <BusinessesSection businesses={data.businesses} {...editorProps} />}
      {tab === "ads" && <AdsSection advertisements={data.advertisements} {...editorProps} />}
      {tab === "coupons" && <CouponsSection coupons={data.coupons} businesses={data.businesses} {...editorProps} />}
      {tab === "finance" && <FinanceSection invoices={data.invoices} />}
      {tab === null && <section className="workspace-card"><WorkspaceEmpty title="Página não encontrada" description="Este endereço não corresponde a uma seção da Área do Anunciante." /><button className="workspace-primary" onClick={() => navigate("overview")}>Voltar para visão geral</button></section>}
    </div>
  </AdvertiserWorkspace>;
}
