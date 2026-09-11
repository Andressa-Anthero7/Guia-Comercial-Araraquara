import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Save, Ticket } from "lucide-react";
import {
  Advertisement, Advertiser, AdvertiserPortalData, AuthenticationError,
  loadAdvertiserPortal, saveAdvertiserCoupon, submitAdvertiserAdvertisement,
  updateAdvertiserBusiness, updateAdvertiserProfile
} from "../api";
import { Business } from "../types";
import { AdvertiserOverview, AdvertiserWorkspace, CouponStatus, PublicBusinessLink, StatusBadge, WorkspaceEmpty, todayInAraraquara } from "./AdvertiserWorkspace";

type Tab = "overview" | "profile" | "businesses" | "ads" | "coupons" | "finance";

type CouponForm = {
  id?: number;
  business: string;
  title: string;
  discount_code: string;
  description: string;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
};

type AdvertisementForm = Pick<
  Advertisement,
  "title" | "short_description" | "description" | "call_to_action" | "destination_url" | "video_url"
>;

const field = "mt-1.5 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

function money(value: string | number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function dateLabel(value: string | null) {
  if (!value) return "Não informado";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

function emptyCoupon(business = ""): CouponForm {
  return { business, title: "", discount_code: "", description: "", starts_at: "", expires_at: "", is_active: true };
}

function businessForm(value: Business) {
  return { ...value, images: value.images ?? [], tags: value.tags ?? [] };
}

export function AdvertiserPortal({ onLogout, onSessionExpired }: { onLogout: () => Promise<void>; onSessionExpired: () => void }) {
  const [data, setData] = useState<AdvertiserPortalData | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Pick<Advertiser, "name" | "document" | "contact_name" | "email" | "phone" | "billing_email"> | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [couponForm, setCouponForm] = useState<CouponForm>(emptyCoupon());
  const [advertisementForm, setAdvertisementForm] = useState<AdvertisementForm | null>(null);
  const [editingAdvertisementId, setEditingAdvertisementId] = useState<number | null>(null);

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const portal = await loadAdvertiserPortal();
      setData(portal);
      setProfile({
        name: portal.advertiser.name,
        document: portal.advertiser.document,
        contact_name: portal.advertiser.contact_name,
        email: portal.advertiser.email,
        phone: portal.advertiser.phone,
        billing_email: portal.advertiser.billing_email
      });
      setCouponForm((current) => current.business ? current : emptyCoupon(portal.businesses[0]?.slug ?? ""));
    } catch (reason) {
      if (reason instanceof AuthenticationError) {
        onSessionExpired();
        return;
      }
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar a área do anunciante.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const finance = useMemo(() => {
    const invoices = data?.invoices ?? [];
    const open = invoices.filter((item) => item.status === "open" || item.status === "overdue");
    const overdue = open.filter((item) => item.status === "overdue" || item.due_date < todayInAraraquara());
    return {
      open: open.reduce((total, item) => total + Number(item.total), 0),
      overdue: overdue.reduce((total, item) => total + Number(item.total), 0),
      overdueCount: overdue.length
    };
  }, [data]);

  const submit = async (action: () => Promise<void>, message: string) => {
    if (saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      await reload();
    } catch (reason) {
      if (reason instanceof AuthenticationError) { onSessionExpired(); return; }
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  const dirty = useMemo(() => {
    if (!data || !profile) return false;
    const changedProfile = Object.entries(profile).some(([key, value]) => value !== data.advertiser[key as keyof Advertiser]);
    const originalBusiness = data.businesses.find(item => item.id === editingBusiness?.id);
    const changedBusiness = editingBusiness && originalBusiness && JSON.stringify(editingBusiness) !== JSON.stringify(businessForm(originalBusiness));
    const originalAd = data.advertisements.find(item => item.id === editingAdvertisementId);
    const changedAd = advertisementForm && originalAd && Object.entries(advertisementForm).some(([key, value]) => value !== originalAd[key as keyof Advertisement]);
    const changedCoupon = Boolean(couponForm.title || couponForm.discount_code || couponForm.description || couponForm.expires_at);
    return Boolean(changedProfile || changedBusiness || changedAd || changedCoupon);
  }, [data, profile, editingBusiness, advertisementForm, editingAdvertisementId, couponForm]);

  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    return () => { window.removeEventListener("beforeunload", beforeUnload); };
  }, [dirty]);

  const discardDrafts = () => {
    setEditingBusiness(null); setEditingAdvertisementId(null); setAdvertisementForm(null);
    setCouponForm(emptyCoupon(data?.businesses[0]?.slug ?? ""));
    if (data) setProfile({ name: data.advertiser.name, document: data.advertiser.document, contact_name: data.advertiser.contact_name, email: data.advertiser.email, phone: data.advertiser.phone, billing_email: data.advertiser.billing_email });
  };
  const leaveDraft = () => !dirty || window.confirm("Você tem alterações não salvas. Descartar as alterações e continuar?");
  const changeTab = (next: Tab) => {
    if (saving || next === tab || !leaveDraft()) return;
    discardDrafts(); setError(""); setNotice(""); setTab(next);
  };
  const refresh = () => { if (!saving && leaveDraft()) { discardDrafts(); setNotice(""); void reload(); } };
  const logout = async () => {
    if (saving || !leaveDraft()) return;
    setSaving(true); setError("");
    try { await onLogout(); } catch (reason) {
      if (reason instanceof AuthenticationError) onSessionExpired();
      else setError(reason instanceof Error ? reason.message : "Não foi possível sair. Tente novamente.");
    } finally { setSaving(false); }
  };

  if (loading && !data) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600" role="status">Carregando área do anunciante...</div>;
  }

  if (!data || !profile) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-center"><div><p className="text-sm font-semibold text-rose-700">{error || "Área indisponível."}</p><button onClick={() => void reload()} className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"><RefreshCw className="h-4 w-4" />Tentar novamente</button></div></div>;
  }

  return (
    <AdvertiserWorkspace data={data} tab={tab} onTab={changeTab} onLogout={() => void logout()} onRefresh={refresh} loading={loading} saving={saving} error={error} notice={notice}>
        {tab === "overview" && <AdvertiserOverview data={data} onTab={changeTab} openAmount={finance.open} overdueCount={finance.overdueCount} />}
        {tab === "profile" && <section className="mt-5 max-w-3xl border border-slate-300 bg-white p-5"><h2 className="text-lg font-bold">Dados do anunciante</h2><p className="workspace-form-intro">Estes são os dados da sua conta. Para alterar as informações exibidas aos clientes, acesse Estabelecimentos. Os campos com * são obrigatórios.</p><form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(async () => { const saved = await updateAdvertiserProfile(profile); setProfile({ name: saved.name, document: saved.document, contact_name: saved.contact_name, email: saved.email, phone: saved.phone, billing_email: saved.billing_email }); }, "Cadastro atualizado."); }}><fieldset disabled={saving} className="contents">
          <label className="text-sm font-semibold">Nome ou razão social *<input required className={field} value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
          <label className="text-sm font-semibold">CPF/CNPJ<input className={field} value={profile.document} onChange={(event) => setProfile({ ...profile, document: event.target.value })} /></label>
          <label className="text-sm font-semibold">Responsável<input className={field} value={profile.contact_name} onChange={(event) => setProfile({ ...profile, contact_name: event.target.value })} /></label>
          <label className="text-sm font-semibold">Telefone/WhatsApp<input className={field} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
          <label className="text-sm font-semibold">E-mail de contato<input type="email" className={field} value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label>
          <label className="text-sm font-semibold">E-mail financeiro<input type="email" className={field} value={profile.billing_email} onChange={(event) => setProfile({ ...profile, billing_email: event.target.value })} /></label>
          <button disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2"><Save className="h-4 w-4" />Salvar dados</button>
        </fieldset></form></section>}

        {tab === "businesses" && <section className="mt-5 space-y-3">{data.businesses.map((business) => <article key={business.id} className="border border-slate-300 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="workspace-record-heading"><h2 className="text-lg font-bold">{business.name}</h2><StatusBadge status={business.status} /></div><p className="mt-2 text-sm text-slate-500">{[business.street, business.number, business.neighborhood].filter(Boolean).join(", ") || "Endereço não informado"}</p><div className="workspace-record-meta"><PublicBusinessLink business={business} /></div></div><button onClick={() => { if (leaveDraft()) { discardDrafts(); setEditingBusiness(businessForm(business)); } }} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Editar dados</button></div>
          {editingBusiness?.id === business.id && <form className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(async () => { await updateAdvertiserBusiness(editingBusiness); setEditingBusiness(null); }, "Dados do estabelecimento atualizados."); }}><fieldset disabled={saving} className="contents">
            <p className="workspace-form-group">Apresentação e contato <span className="font-normal">· Campos com * são obrigatórios</span></p>
            <label className="text-sm font-semibold">Nome *<input required className={field} value={editingBusiness.name} onChange={(event) => setEditingBusiness({ ...editingBusiness, name: event.target.value })} /></label>
            <label className="text-sm font-semibold">Telefone comercial<input className={field} value={editingBusiness.phone} onChange={(event) => setEditingBusiness({ ...editingBusiness, phone: event.target.value })} /></label>
            <label className="text-sm font-semibold">WhatsApp *<input required className={field} value={editingBusiness.whatsapp} onChange={(event) => setEditingBusiness({ ...editingBusiness, whatsapp: event.target.value })} /></label>
            <label className="text-sm font-semibold sm:col-span-2">Descrição *<textarea required className={`${field} h-24 py-2`} value={editingBusiness.description} onChange={(event) => setEditingBusiness({ ...editingBusiness, description: event.target.value })} /></label><label className="text-sm font-semibold sm:col-span-2">Produtos e serviços<textarea className={`${field} h-20 py-2`} value={editingBusiness.servicesProducts ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, servicesProducts: event.target.value })} /></label>
            <p className="workspace-form-group">Localização e atendimento</p>
            <label className="text-sm font-semibold">Rua<input className={field} value={editingBusiness.street ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, street: event.target.value })} /></label><label className="text-sm font-semibold">Número<input className={field} value={editingBusiness.number ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, number: event.target.value })} /></label>
            <label className="text-sm font-semibold">Bairro<input className={field} value={editingBusiness.neighborhood} onChange={(event) => setEditingBusiness({ ...editingBusiness, neighborhood: event.target.value })} /></label><label className="text-sm font-semibold">Horário de atendimento<input className={field} value={editingBusiness.hours} onChange={(event) => setEditingBusiness({ ...editingBusiness, hours: event.target.value })} /></label>
            <p className="workspace-form-group">Presença digital</p>
            <label className="text-sm font-semibold">E-mail<input type="email" className={field} value={editingBusiness.email ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, email: event.target.value })} /></label><label className="text-sm font-semibold">Site<input type="url" className={field} value={editingBusiness.website ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, website: event.target.value })} /></label>
            <label className="text-sm font-semibold sm:col-span-2">Instagram<input className={field} value={editingBusiness.instagram ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, instagram: event.target.value })} /></label>
            <div className="flex gap-3 sm:col-span-2"><button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-60"><Save className="h-4 w-4" />Salvar</button><button type="button" onClick={() => { if (leaveDraft()) setEditingBusiness(null); }} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold">Cancelar</button></div>
          </fieldset></form>}</article>)}{!data.businesses.length && <div className="workspace-card"><WorkspaceEmpty title="Nenhum estabelecimento vinculado" description="Solicite à equipe do Guia o vínculo da sua empresa com este acesso. Assim você poderá atualizar sua página por aqui." /></div>}</section>}

        {tab === "ads" && <section className="mt-5 space-y-3">{data.advertisements.map((advertisement) => <article key={advertisement.id} className="border border-slate-300 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{advertisement.title}</h2><div className="workspace-record-meta"><p className="text-sm text-slate-500">{advertisement.business_name}</p><StatusBadge status={advertisement.status} /></div><p className="workspace-form-intro">{advertisement.short_description || "Adicione uma chamada curta para apresentar o seu anúncio."}</p></div><button onClick={() => { if (!leaveDraft()) return; discardDrafts(); setEditingAdvertisementId(advertisement.id); setAdvertisementForm({ title: advertisement.title, short_description: advertisement.short_description, description: advertisement.description, call_to_action: advertisement.call_to_action, destination_url: advertisement.destination_url, video_url: advertisement.video_url }); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Editar anúncio</button></div>
          {editingAdvertisementId === advertisement.id && advertisementForm && <form className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(async () => { await submitAdvertiserAdvertisement(advertisement.id, advertisementForm); setEditingAdvertisementId(null); setAdvertisementForm(null); }, "Alterações enviadas para revisão."); }}><fieldset disabled={saving} className="contents">
            <p className="workspace-form-group">Ao enviar, o anúncio ficará em revisão pela equipe do Guia. Confira o conteúdo antes de confirmar.</p>
            <label className="text-sm font-semibold">Título *<input required className={field} value={advertisementForm.title} onChange={(event) => setAdvertisementForm({ ...advertisementForm, title: event.target.value })} /></label><label className="text-sm font-semibold">Chamada curta<input className={field} value={advertisementForm.short_description} onChange={(event) => setAdvertisementForm({ ...advertisementForm, short_description: event.target.value })} /></label><label className="text-sm font-semibold sm:col-span-2">Texto do anúncio<textarea className={`${field} h-28 py-2`} value={advertisementForm.description} onChange={(event) => setAdvertisementForm({ ...advertisementForm, description: event.target.value })} /></label><label className="text-sm font-semibold">Chamada para ação<input className={field} value={advertisementForm.call_to_action} onChange={(event) => setAdvertisementForm({ ...advertisementForm, call_to_action: event.target.value })} /></label><label className="text-sm font-semibold">Link de destino<input type="url" className={field} value={advertisementForm.destination_url} onChange={(event) => setAdvertisementForm({ ...advertisementForm, destination_url: event.target.value })} /></label><div className="flex gap-3 sm:col-span-2"><button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-60"><ClipboardCheckIcon />Enviar para revisão</button><button type="button" onClick={() => { if (leaveDraft()) { setEditingAdvertisementId(null); setAdvertisementForm(null); } }} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold">Cancelar</button></div></fieldset></form>}</article>)}{!data.advertisements.length && <div className="workspace-card"><WorkspaceEmpty title="Seu próximo anúncio começa com uma boa ideia" description="Ainda não há anúncios cadastrados. Fale com a equipe do Guia sobre a divulgação do seu estabelecimento." /></div>}</section>}

        {tab === "coupons" && <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="workspace-table-scroll" role="region" aria-label="Lista de cupons" tabIndex={0}><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Cupom</th><th className="px-4 py-3">Estabelecimento</th><th className="px-4 py-3">Validade</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-200">{data.coupons.map((coupon) => <tr key={coupon.id}><td className="px-4 py-3"><b>{coupon.title}</b><div className="text-xs text-slate-500">{coupon.discount_code}</div></td><td className="px-4 py-3">{coupon.business_name}</td><td className="px-4 py-3">{dateLabel(coupon.expires_at)}</td><td className="px-4 py-3"><CouponStatus coupon={coupon} /></td></tr>)}{!data.coupons.length && <tr><td className="px-4 py-4 text-slate-500" colSpan={4}><WorkspaceEmpty title="Nenhum cupom cadastrado" description="Use o formulário para criar uma oferta. Informe o benefício, as regras de uso e a validade." /></td></tr>}</tbody></table></div>
          <form className="border border-slate-300 bg-white p-4" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(async () => { await saveAdvertiserCoupon({ ...couponForm, starts_at: couponForm.starts_at || null, expires_at: couponForm.expires_at || null }); setCouponForm(emptyCoupon(data.businesses[0]?.slug ?? "")); }, "Cupom salvo."); }}><fieldset disabled={saving} className="contents"><h2 className="font-bold">Novo cupom</h2><p className="workspace-form-intro">Preencha título, código e descrição da oferta. A validade é opcional.</p><div className="mt-4 space-y-3"><label className="block text-sm font-semibold">Estabelecimento<select required className={field} value={couponForm.business} onChange={(event) => setCouponForm({ ...couponForm, business: event.target.value })}><option value="">Selecione</option>{data.businesses.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label><label className="block text-sm font-semibold">Título<input required className={field} value={couponForm.title} onChange={(event) => setCouponForm({ ...couponForm, title: event.target.value })} /></label><label className="block text-sm font-semibold">Código<input required className={field} value={couponForm.discount_code} onChange={(event) => setCouponForm({ ...couponForm, discount_code: event.target.value })} /></label><label className="block text-sm font-semibold">Descrição *<textarea required className={`${field} h-20 py-2`} value={couponForm.description} onChange={(event) => setCouponForm({ ...couponForm, description: event.target.value })} /></label><label className="block text-sm font-semibold">Validade<input type="date" className={field} value={couponForm.expires_at} onChange={(event) => setCouponForm({ ...couponForm, expires_at: event.target.value })} /></label><button disabled={saving || !data.businesses.length} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-60"><Ticket className="h-4 w-4" />Salvar cupom</button></div></fieldset></form></section>}

        {tab === "finance" && <section className="mt-5"><div className="workspace-finance-summary"><div><span>Valores em aberto</span><strong>{money(finance.open)}</strong></div><div><span>Total vencido</span><strong>{money(finance.overdue)}</strong></div><div><span>Cobranças cadastradas</span><strong>{data.invoices.length}</strong></div></div><div className="workspace-table-scroll" role="region" aria-label="Histórico financeiro" tabIndex={0}><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Referência</th><th className="px-4 py-3">Estabelecimento</th><th className="px-4 py-3">Vencimento</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Pagamento</th></tr></thead><tbody className="divide-y divide-slate-200">{data.invoices.map((invoice) => <tr key={invoice.id}><td className="px-4 py-3">{invoice.description || invoice.reference_month}</td><td className="px-4 py-3">{invoice.business_name}</td><td className="px-4 py-3">{dateLabel(invoice.due_date)}</td><td className="px-4 py-3 font-semibold">{money(invoice.total)}</td><td className="px-4 py-3"><StatusBadge status={invoice.status === "open" && invoice.due_date < todayInAraraquara() ? "overdue" : invoice.status} /></td><td className="px-4 py-3">{{ pix: "PIX", cash: "Dinheiro", credit_card: "Cartão de crédito", debit_card: "Cartão de débito", bank_transfer: "Transferência", card: "Cartão", transfer: "Transferência", boleto: "Boleto", other: "Outro" }[invoice.payment_method] || "Não registrado"}</td></tr>)}{!data.invoices.length && <tr><td colSpan={6} className="px-4 py-5 text-slate-500"><WorkspaceEmpty title="Nenhuma cobrança cadastrada." description="Quando houver cobranças, você poderá acompanhar os valores, vencimentos e pagamentos registrados neste espaço." /></td></tr>}</tbody></table></div><p className="workspace-hint">Os pagamentos on-line ainda não estão disponíveis. Este espaço exibe os registros financeiros da sua conta.</p></section>}
    </AdvertiserWorkspace>
  );
}

function ClipboardCheckIcon() {
  return <CheckCircle2 className="h-4 w-4" />;
}
