import { useState } from "react";
import { Pencil, Plus, Ticket } from "lucide-react";
import { AdvertiserCoupon, saveAdvertiserCoupon } from "../../api";
import { Business } from "../../types";
import { CouponStatus, todayInAraraquara, WorkspaceEmpty } from "../AdvertiserWorkspace";
import { confirmDiscard, dateLabel, EditorHeading, EditorProps, Field, FormSection, matches, NoResults, SaveBar, SearchField, SectionSummary, useDirty } from "./shared";

type CouponDraft = { id?: number; business: string; title: string; discount_code: string; description: string; starts_at: string; expires_at: string; is_active: boolean };
const emptyCoupon = (business: string): CouponDraft => ({ business, title: "", discount_code: "", description: "", starts_at: "", expires_at: "", is_active: true });
const couponDraft = (coupon: AdvertiserCoupon): CouponDraft => ({ id: coupon.id, business: coupon.business, title: coupon.title, discount_code: coupon.discount_code, description: coupon.description, starts_at: coupon.starts_at || "", expires_at: coupon.expires_at || "", is_active: coupon.is_active });
function couponState(coupon: AdvertiserCoupon) {
  return !coupon.is_active ? "inactive" : coupon.is_valid ? "active" : coupon.starts_at && coupon.starts_at > todayInAraraquara() ? "scheduled" : "expired";
}
export function CouponsSection({ coupons, businesses, saving, onSave, onDirtyChange }: EditorProps & { coupons: AdvertiserCoupon[]; businesses: Business[] }) {
  const eligible = businesses.filter(item => item.planType === "paid" && item.slug);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState<CouponDraft | null>(null);
  const [baseline, setBaseline] = useState<CouponDraft | null>(null);
  const dirty = Boolean(draft && JSON.stringify(draft) !== JSON.stringify(baseline));
  useDirty(dirty, onDirtyChange);
  const back = () => { if (!saving && confirmDiscard(dirty)) { setDraft(null); setBaseline(null); } };
  const open = (value: CouponDraft) => { setDraft(value); setBaseline(value); };
  const visible = coupons.filter(item => (!status || couponState(item) === status) && matches(query, item.title, item.discount_code, item.business_name));
  if (draft) {
    const set = <K extends keyof CouponDraft>(key: K, value: CouponDraft[K]) => setDraft(current => current && ({ ...current, [key]: value }));
    return <div className="advertiser-detail-layout"><form className="advertiser-editor" onSubmit={async event => { event.preventDefault(); if (await onSave(() => saveAdvertiserCoupon({ ...draft, starts_at: draft.starts_at || null, expires_at: draft.expires_at || null }), "Cupom salvo.")) { setDraft(null); setBaseline(null); } }}><EditorHeading title={draft.id ? "Editar cupom" : "Novo cupom"} detail="Defina o benefício, as regras e o período de uso. Campos com * são obrigatórios." onBack={back} saving={saving} /><fieldset disabled={saving}>
      <FormSection title="Oferta" description="O código identifica o cupom que o cliente apresentará à empresa.">
        <Field label="Estabelecimento *" wide><select required value={draft.business} onChange={e => set("business", e.target.value)}><option value="">Selecione</option>{businesses.filter(item => item.planType === "paid" || item.slug === draft.business).map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></Field>
        <Field label="Título *"><input required value={draft.title} onChange={e => set("title", e.target.value)} /></Field>
        <Field label="Código *"><input required value={draft.discount_code} onChange={e => set("discount_code", e.target.value)} autoCapitalize="characters" /></Field>
        <Field label="Descrição *" wide hint="Explique o benefício, as condições e eventuais restrições."><textarea required rows={5} value={draft.description} onChange={e => set("description", e.target.value)} /></Field>
      </FormSection>
      <FormSection title="Validade e disponibilidade" description="As datas são opcionais. O cupom ativo fica válido dentro do período informado.">
        <Field label="Início"><input type="date" max={draft.expires_at || undefined} value={draft.starts_at} onChange={e => set("starts_at", e.target.value)} /></Field>
        <Field label="Validade"><input type="date" min={draft.starts_at || undefined} value={draft.expires_at} onChange={e => set("expires_at", e.target.value)} /></Field>
        <label className="advertiser-checkbox wide"><input type="checkbox" checked={draft.is_active} onChange={e => set("is_active", e.target.checked)} /><span><b>Cupom ativo</b><small>Desmarque para interromper a disponibilidade da oferta.</small></span></label>
      </FormSection><SaveBar saving={saving} dirty={dirty} label="Salvar cupom" onCancel={back} /></fieldset></form><aside className="advertiser-detail-aside"><section className="workspace-card advertiser-coupon-preview"><h3>Prévia da oferta</h3><Ticket size={30} /><h4>{draft.title || "Título da oferta"}</h4><p>{draft.description || "Descreva as condições do benefício."}</p><code>{draft.discount_code || "CÓDIGO"}</code><small>{draft.expires_at ? `Válido até ${dateLabel(draft.expires_at)}` : "Sem data final definida"}</small></section><section className="advertiser-guidance"><h3>Regras claras</h3><p>Informe se a oferta tem limite por cliente, produtos específicos ou dias de atendimento. Isso facilita o uso do cupom.</p></section></aside></div>;
  }
  return <section className="advertiser-section"><SectionSummary items={[{ label: "Cupons cadastrados", value: coupons.length }, { label: "Válidos agora", value: coupons.filter(item => item.is_valid).length }, { label: "Agendados", value: coupons.filter(item => couponState(item) === "scheduled").length }]} />
    <div className="advertiser-toolbar"><SearchField label="Buscar cupom ou código" value={query} onChange={setQuery} /><label className="advertiser-filter">Status do cupom<select aria-label="Status do cupom" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos os status</option><option value="active">Ativo</option><option value="scheduled">Agendado</option><option value="expired">Expirado</option><option value="inactive">Inativo</option></select></label><button className="workspace-primary" disabled={!eligible.length} onClick={() => open(emptyCoupon(eligible[0].slug!))}><Plus size={16} />Novo cupom</button></div>
    {!eligible.length && <p className="advertiser-inline-note">Cupons exigem um estabelecimento com plano pago vinculado à conta. Consulte a equipe do Guia sobre a disponibilidade desse benefício.</p>}
    <div className="advertiser-coupon-list" role="region" aria-label="Lista de cupons">{visible.map(coupon => <article key={coupon.id} className="advertiser-coupon-card"><div><Ticket size={22} /><CouponStatus coupon={coupon} /></div><h3>{coupon.title}</h3><span>{coupon.business_name}</span><p>{coupon.description}</p><code>{coupon.discount_code}</code><dl className="advertiser-record-facts"><div><dt>Início</dt><dd>{coupon.starts_at ? dateLabel(coupon.starts_at) : "Sem data inicial"}</dd></div><div><dt>Validade</dt><dd>{coupon.expires_at ? dateLabel(coupon.expires_at) : "Sem data final"}</dd></div></dl><button className="workspace-secondary" onClick={() => open(couponDraft(coupon))}><Pencil size={15} />Editar cupom</button></article>)}</div>
    {!coupons.length ? <div className="workspace-card"><WorkspaceEmpty title="Nenhum cupom cadastrado" description={eligible.length ? "Clique em Novo cupom para cadastrar uma oferta para os clientes da sua empresa." : "As ofertas cadastradas para os seus estabelecimentos aparecerão neste espaço."} /></div> : !visible.length && <NoResults onClear={() => { setQuery(""); setStatus(""); }} />}
  </section>;
}
