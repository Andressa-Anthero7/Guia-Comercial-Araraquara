import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2, CheckCircle2, CreditCard, FileText, LogOut, Megaphone,
  RefreshCw, Save, Store, Ticket, UserRound
} from "lucide-react";
import {
  Advertisement, Advertiser, AdvertiserCoupon, AdvertiserPortalData,
  loadAdvertiserPortal, saveAdvertiserCoupon, submitAdvertiserAdvertisement,
  updateAdvertiserBusiness, updateAdvertiserProfile
} from "../api";
import { Business } from "../types";

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
  if (!value) return "Nao informado";
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("pt-BR");
}

function emptyCoupon(business = ""): CouponForm {
  return { business, title: "", discount_code: "", description: "", starts_at: "", expires_at: "", is_active: true };
}

function businessForm(value: Business) {
  return { ...value, images: value.images ?? [], tags: value.tags ?? [] };
}

export function AdvertiserPortal({ onLogout }: { onLogout: () => Promise<void> }) {
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
      setError(reason instanceof Error ? reason.message : "Nao foi possivel carregar a area do anunciante.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const finance = useMemo(() => {
    const invoices = data?.invoices ?? [];
    const open = invoices.filter((item) => item.status === "open" || item.status === "overdue");
    const overdue = open.filter((item) => item.status === "overdue" || item.due_date < new Date().toISOString().slice(0, 10));
    return {
      open: open.reduce((total, item) => total + Number(item.total), 0),
      overdue: overdue.reduce((total, item) => total + Number(item.total), 0),
      overdueCount: overdue.length
    };
  }, [data]);

  const submit = async (action: () => Promise<void>, message: string) => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(message);
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel salvar as alteracoes.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-semibold text-slate-600">Carregando area do anunciante...</div>;
  }

  if (!data || !profile) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-center"><div><p className="text-sm font-semibold text-rose-700">{error || "Area indisponivel."}</p><button onClick={() => void reload()} className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"><RefreshCw className="h-4 w-4" />Tentar novamente</button></div></div>;
  }

  const tabs: Array<[Tab, string, typeof Store]> = [
    ["overview", "Visao geral", Store], ["profile", "Cadastro", UserRound],
    ["businesses", "Estabelecimentos", Building2], ["ads", "Anuncios", Megaphone],
    ["coupons", "Cupons", Ticket], ["finance", "Financeiro", CreditCard]
  ];

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-400 text-slate-950"><Store className="h-5 w-5" /></div><div className="min-w-0"><h1 className="truncate text-base font-bold">Area do Anunciante</h1><p className="truncate text-xs text-slate-300">{data.advertiser.name}</p></div></div>
          <button onClick={() => void onLogout()} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-sm font-semibold hover:bg-slate-800"><LogOut className="h-4 w-4" />Sair</button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-300">
          {tabs.map(([value, label, Icon]) => <button key={value} onClick={() => setTab(value)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-semibold ${tab === value ? "border-slate-950 text-slate-950" : "border-transparent text-slate-500 hover:text-slate-800"}`}><Icon className="h-4 w-4" />{label}</button>)}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3"><div>{error && <p className="text-sm font-semibold text-rose-700">{error}</p>}{notice && <p className="text-sm font-semibold text-emerald-700">{notice}</p>}</div><button onClick={() => void reload()} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Atualizar</button></div>

        {tab === "overview" && <section className="mt-5 space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{([
          ["Estabelecimentos", data.businesses.length, Building2], ["Anuncios", data.advertisements.length, Megaphone],
          ["Em aberto", money(finance.open), CreditCard], ["Vencidas", finance.overdueCount, FileText]
        ] as const).map(([label, value, Icon]) => { const CardIcon = Icon as typeof Store; return <div key={String(label)} className="border border-slate-300 bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500"><span>{label}</span><CardIcon className="h-4 w-4 text-slate-400" /></div><div className="mt-3 text-2xl font-bold tabular-nums">{value}</div></div>; })}</div>
          <div className="grid gap-4 lg:grid-cols-2"><section className="border border-slate-300 bg-white p-4"><h2 className="font-bold">Situacao comercial</h2><div className="mt-3 space-y-3 text-sm">{data.subscriptions.length ? data.subscriptions.map((item) => <div key={item.id} className="flex items-start justify-between border-b border-slate-100 pb-3 last:border-0"><span><b>{item.business_name}</b><br/><span className="text-slate-500">{item.plan_name} · proximo vencimento {dateLabel(item.next_due_date)}</span></span><b>{money(item.agreed_price)}</b></div>) : <p className="text-slate-500">Nenhum contrato cadastrado.</p>}</div></section>
          <section className="border border-slate-300 bg-white p-4"><h2 className="font-bold">Pendencias</h2><div className="mt-3 space-y-2 text-sm"><p className={finance.overdueCount ? "font-semibold text-rose-700" : "text-slate-600"}>{finance.overdueCount ? `${finance.overdueCount} cobranca(s) vencida(s): ${money(finance.overdue)}` : "Nenhuma cobranca vencida."}</p><p className="text-slate-600">Para pagamento presencial ou PIX, use os dados informados pelo Guia Comercial.</p></div></section></div></section>}

        {tab === "profile" && <section className="mt-5 max-w-3xl border border-slate-300 bg-white p-5"><h2 className="text-lg font-bold">Dados do anunciante</h2><form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(async () => { const saved = await updateAdvertiserProfile(profile); setProfile({ name: saved.name, document: saved.document, contact_name: saved.contact_name, email: saved.email, phone: saved.phone, billing_email: saved.billing_email }); }, "Cadastro atualizado."); }}>
          <label className="text-sm font-semibold">Nome ou razao social<input required className={field} value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
          <label className="text-sm font-semibold">CPF/CNPJ<input className={field} value={profile.document} onChange={(event) => setProfile({ ...profile, document: event.target.value })} /></label>
          <label className="text-sm font-semibold">Responsavel<input className={field} value={profile.contact_name} onChange={(event) => setProfile({ ...profile, contact_name: event.target.value })} /></label>
          <label className="text-sm font-semibold">Telefone/WhatsApp<input className={field} value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
          <label className="text-sm font-semibold">E-mail de contato<input type="email" className={field} value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label>
          <label className="text-sm font-semibold">E-mail financeiro<input type="email" className={field} value={profile.billing_email} onChange={(event) => setProfile({ ...profile, billing_email: event.target.value })} /></label>
          <button disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-60 sm:col-span-2"><Save className="h-4 w-4" />Salvar dados</button>
        </form></section>}

        {tab === "businesses" && <section className="mt-5 space-y-3">{data.businesses.map((business) => <article key={business.id} className="border border-slate-300 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{business.name}</h2><p className="mt-1 text-sm text-slate-500">{business.street}, {business.number} · {business.status}</p></div><button onClick={() => setEditingBusiness(businessForm(business))} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Editar dados</button></div>
          {editingBusiness?.id === business.id && <form className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(async () => { const saved = await updateAdvertiserBusiness(editingBusiness); setEditingBusiness(businessForm(saved)); }, "Dados do estabelecimento atualizados."); }}>
            <label className="text-sm font-semibold">Nome<input required className={field} value={editingBusiness.name} onChange={(event) => setEditingBusiness({ ...editingBusiness, name: event.target.value })} /></label><label className="text-sm font-semibold">Telefone/WhatsApp<input required className={field} value={editingBusiness.phone} onChange={(event) => setEditingBusiness({ ...editingBusiness, phone: event.target.value, whatsapp: event.target.value.replace(/\D/g, "") })} /></label>
            <label className="text-sm font-semibold sm:col-span-2">Descricao<textarea required className={`${field} h-24 py-2`} value={editingBusiness.description} onChange={(event) => setEditingBusiness({ ...editingBusiness, description: event.target.value })} /></label><label className="text-sm font-semibold sm:col-span-2">Produtos e servicos<textarea className={`${field} h-20 py-2`} value={editingBusiness.servicesProducts ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, servicesProducts: event.target.value })} /></label>
            <label className="text-sm font-semibold">Rua<input className={field} value={editingBusiness.street ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, street: event.target.value })} /></label><label className="text-sm font-semibold">Numero<input className={field} value={editingBusiness.number ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, number: event.target.value })} /></label>
            <label className="text-sm font-semibold">Bairro<input className={field} value={editingBusiness.neighborhood} onChange={(event) => setEditingBusiness({ ...editingBusiness, neighborhood: event.target.value })} /></label><label className="text-sm font-semibold">Horario de atendimento<input className={field} value={editingBusiness.hours} onChange={(event) => setEditingBusiness({ ...editingBusiness, hours: event.target.value })} /></label>
            <label className="text-sm font-semibold">E-mail<input type="email" className={field} value={editingBusiness.email ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, email: event.target.value })} /></label><label className="text-sm font-semibold">Site<input type="url" className={field} value={editingBusiness.website ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, website: event.target.value })} /></label>
            <label className="text-sm font-semibold sm:col-span-2">Instagram<input className={field} value={editingBusiness.instagram ?? ""} onChange={(event) => setEditingBusiness({ ...editingBusiness, instagram: event.target.value })} /></label>
            <div className="flex gap-3 sm:col-span-2"><button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-60"><Save className="h-4 w-4" />Salvar</button><button type="button" onClick={() => setEditingBusiness(null)} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold">Cancelar</button></div>
          </form>}</article>)}{!data.businesses.length && <p className="border border-slate-300 bg-white p-5 text-sm text-slate-500">Nenhum estabelecimento vinculado a este acesso.</p>}</section>}

        {tab === "ads" && <section className="mt-5 space-y-3">{data.advertisements.map((advertisement) => <article key={advertisement.id} className="border border-slate-300 bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{advertisement.title}</h2><p className="mt-1 text-sm text-slate-500">{advertisement.business_name} · status: {advertisement.status}</p></div><button onClick={() => { setEditingAdvertisementId(advertisement.id); setAdvertisementForm({ title: advertisement.title, short_description: advertisement.short_description, description: advertisement.description, call_to_action: advertisement.call_to_action, destination_url: advertisement.destination_url, video_url: advertisement.video_url }); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Editar anuncio</button></div>
          {editingAdvertisementId === advertisement.id && advertisementForm && <form className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(async () => { await submitAdvertiserAdvertisement(advertisement.id, advertisementForm); setEditingAdvertisementId(null); setAdvertisementForm(null); }, "Alteracoes enviadas para revisao."); }}>
            <label className="text-sm font-semibold">Titulo<input required className={field} value={advertisementForm.title} onChange={(event) => setAdvertisementForm({ ...advertisementForm, title: event.target.value })} /></label><label className="text-sm font-semibold">Chamada curta<input className={field} value={advertisementForm.short_description} onChange={(event) => setAdvertisementForm({ ...advertisementForm, short_description: event.target.value })} /></label><label className="text-sm font-semibold sm:col-span-2">Texto do anuncio<textarea className={`${field} h-28 py-2`} value={advertisementForm.description} onChange={(event) => setAdvertisementForm({ ...advertisementForm, description: event.target.value })} /></label><label className="text-sm font-semibold">Chamada para acao<input className={field} value={advertisementForm.call_to_action} onChange={(event) => setAdvertisementForm({ ...advertisementForm, call_to_action: event.target.value })} /></label><label className="text-sm font-semibold">Link de destino<input type="url" className={field} value={advertisementForm.destination_url} onChange={(event) => setAdvertisementForm({ ...advertisementForm, destination_url: event.target.value })} /></label><div className="flex gap-3 sm:col-span-2"><button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-60"><ClipboardCheckIcon />Enviar para revisao</button><button type="button" onClick={() => { setEditingAdvertisementId(null); setAdvertisementForm(null); }} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold">Cancelar</button></div></form>}</article>)}{!data.advertisements.length && <p className="border border-slate-300 bg-white p-5 text-sm text-slate-500">Nenhum anuncio cadastrado.</p>}</section>}

        {tab === "coupons" && <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="overflow-hidden border border-slate-300 bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Cupom</th><th className="px-4 py-3">Estabelecimento</th><th className="px-4 py-3">Validade</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-200">{data.coupons.map((coupon) => <tr key={coupon.id}><td className="px-4 py-3"><b>{coupon.title}</b><div className="text-xs text-slate-500">{coupon.discount_code}</div></td><td className="px-4 py-3">{coupon.business_name}</td><td className="px-4 py-3">{dateLabel(coupon.expires_at)}</td><td className="px-4 py-3">{coupon.is_active ? "Ativo" : "Inativo"}</td></tr>)}{!data.coupons.length && <tr><td className="px-4 py-4 text-slate-500" colSpan={4}>Nenhum cupom cadastrado.</td></tr>}</tbody></table></div>
          <form className="border border-slate-300 bg-white p-4" onSubmit={(event: FormEvent) => { event.preventDefault(); void submit(async () => { await saveAdvertiserCoupon({ ...couponForm, starts_at: couponForm.starts_at || null, expires_at: couponForm.expires_at || null }); setCouponForm(emptyCoupon(data.businesses[0]?.slug ?? "")); }, "Cupom salvo."); }}><h2 className="font-bold">Novo cupom</h2><div className="mt-4 space-y-3"><label className="block text-sm font-semibold">Estabelecimento<select required className={field} value={couponForm.business} onChange={(event) => setCouponForm({ ...couponForm, business: event.target.value })}><option value="">Selecione</option>{data.businesses.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label><label className="block text-sm font-semibold">Titulo<input required className={field} value={couponForm.title} onChange={(event) => setCouponForm({ ...couponForm, title: event.target.value })} /></label><label className="block text-sm font-semibold">Codigo<input required className={field} value={couponForm.discount_code} onChange={(event) => setCouponForm({ ...couponForm, discount_code: event.target.value })} /></label><label className="block text-sm font-semibold">Descricao<textarea required className={`${field} h-20 py-2`} value={couponForm.description} onChange={(event) => setCouponForm({ ...couponForm, description: event.target.value })} /></label><label className="block text-sm font-semibold">Validade<input type="date" className={field} value={couponForm.expires_at} onChange={(event) => setCouponForm({ ...couponForm, expires_at: event.target.value })} /></label><button disabled={saving} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white disabled:opacity-60"><Ticket className="h-4 w-4" />Salvar cupom</button></div></form></section>}

        {tab === "finance" && <section className="mt-5 overflow-hidden border border-slate-300 bg-white"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs uppercase text-slate-600"><tr><th className="px-4 py-3">Referencia</th><th className="px-4 py-3">Estabelecimento</th><th className="px-4 py-3">Vencimento</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Pagamento</th></tr></thead><tbody className="divide-y divide-slate-200">{data.invoices.map((invoice) => <tr key={invoice.id}><td className="px-4 py-3">{invoice.description || invoice.reference_month}</td><td className="px-4 py-3">{invoice.business_name}</td><td className="px-4 py-3">{dateLabel(invoice.due_date)}</td><td className="px-4 py-3 font-semibold">{money(invoice.total)}</td><td className="px-4 py-3">{invoice.status}</td><td className="px-4 py-3">{invoice.payment_method || "A combinar"}</td></tr>)}{!data.invoices.length && <tr><td colSpan={6} className="px-4 py-5 text-slate-500">Nenhuma cobranca cadastrada.</td></tr>}</tbody></table></section>}
      </div>
    </main>
  );
}

function ClipboardCheckIcon() {
  return <CheckCircle2 className="h-4 w-4" />;
}
