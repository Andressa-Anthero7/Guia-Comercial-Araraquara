import { ReactNode, useEffect, useRef } from "react";
import { ArrowDownLeft, ArrowRight, Building2, Check, ChevronRight, CircleHelp, CreditCard, ExternalLink, LayoutDashboard, LogOut, MapPin, Megaphone, RefreshCw, Store, Ticket, UserRound } from "lucide-react";
import { AdvertiserCoupon, AdvertiserPortalData } from "../api";
import { Business } from "../types";
import "./advertiser-workspace.css";

import { advertiserPaths, AdvertiserTab } from "../advertiserRoutes";
export type { AdvertiserTab } from "../advertiserRoutes";
import "./advertiser/sections.css";
const navigation = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard, description: "Estabelecimentos, anúncios, cupons e financeiro." },
  { id: "businesses", label: "Estabelecimentos", icon: Building2, description: "Mantenha as informações que seus clientes encontram sempre atualizadas." },
  { id: "ads", label: "Anúncios", icon: Megaphone, description: "Apresente seu negócio com uma mensagem clara e acompanhe a revisão dos anúncios." },
  { id: "coupons", label: "Cupons", icon: Ticket, description: "Crie boas oportunidades para seus clientes conhecerem e voltarem ao seu negócio." },
  { id: "finance", label: "Financeiro", icon: CreditCard, description: "Consulte os valores, vencimentos e registros de pagamento da sua conta." },
  { id: "profile", label: "Cadastro", icon: UserRound, description: "Confira os dados do responsável e os contatos da sua conta de anunciante." },
] as const;

const statusLabels: Record<string, string> = {
  active: "Ativo", inactive: "Inativo", pending: "Em análise", draft: "Rascunho", suspended: "Suspenso",
  review: "Em revisão", published: "Publicado", paused: "Pausado", ended: "Encerrado",
  open: "Em aberto", paid: "Pago", overdue: "Vencido", cancelled: "Cancelado", canceled: "Cancelado", prospect: "Em cadastro",
  scheduled: "Agendado", expired: "Expirado", unavailable: "Indisponível",
};
export function StatusBadge({ status }: { status?: string }) {
  const tone = ["active", "published", "paid"].includes(status || "") ? "success" : ["overdue", "suspended"].includes(status || "") ? "danger" : ["pending", "review", "open"].includes(status || "") ? "warning" : "neutral";
  return <span className={`workspace-badge ${tone}`}><span aria-hidden="true" />{statusLabels[status || ""] || "Não informado"}</span>;
}
export function todayInAraraquara() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}
export function CouponStatus({ coupon }: { coupon: AdvertiserCoupon }) {
  const today = todayInAraraquara();
  return <StatusBadge status={!coupon.is_active ? "inactive" : coupon.is_valid ? "active" : coupon.starts_at && coupon.starts_at > today ? "scheduled" : coupon.expires_at && coupon.expires_at < today ? "expired" : "unavailable"} />;
}
export function businessPageUrl(business: Business) {
  const subdomain = business.publicSubdomain;
  return business.planType === "paid" && subdomain && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(subdomain)
    ? `https://${subdomain}.guiacomararaquara.com.br/`
    : `https://guiacomararaquara.com.br/?empresa=${encodeURIComponent(business.slug || business.id)}`;
}
export function PublicBusinessLink({ business }: { business: Business }) {
  return business.status === "active" ? <a className="workspace-text-link" href={businessPageUrl(business)} target="_blank" rel="noopener noreferrer">Ver página pública <ExternalLink size={15} aria-hidden="true" /><span className="sr-only"> de {business.name} (abre em outra aba)</span></a> : null;
}

export function AdvertiserWorkspace({ data, tab, onTab, onLogout, onRefresh, loading, saving, busyMessage, error, notice, children }: {
  data: AdvertiserPortalData; tab: AdvertiserTab | null; onTab: (tab: AdvertiserTab) => void; onLogout: () => void; onRefresh: () => void;
  loading: boolean; saving: boolean; busyMessage?: string; error: string; notice: string; children: ReactNode;
}) {
  const current = navigation.find(item => item.id === tab) ?? { label: "Página não encontrada", description: "Escolha uma seção no menu para continuar." };
  useEffect(() => { const previous = document.title; document.title = `${current.label} | Área do Anunciante`; return () => { document.title = previous; }; }, [current.label]);
  useEffect(() => { if (error || notice) document.querySelector<HTMLElement>(".workspace-feedback")?.scrollIntoView({ block: "nearest" }); }, [error, notice]);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousTab = useRef(tab);
  useEffect(() => {
    if (previousTab.current !== tab) { heading.current?.focus({ preventScroll: true }); previousTab.current = tab; }
  }, [tab]);
  return <div className="advertiser-workspace">
    <a href="#advertiser-content" className="workspace-skip">Pular para o conteúdo</a>
    <aside className="workspace-sidebar">
      <a href="https://guiacomararaquara.com.br/" className="workspace-brand" aria-label="Guia Comercial Araraquara — página inicial"><span className="workspace-brand-icon"><Store size={24} /></span><span>Guia Comercial<small>ARARAQUARA</small></span></a>
      <div className="workspace-nav-label">SEU ESPAÇO DE GESTÃO</div>
      <nav aria-label="Navegação do anunciante">{navigation.map(({ id, label, icon: Icon }) => <a key={id} href={advertiserPaths[id]} aria-current={tab === id ? "page" : undefined} aria-disabled={saving || undefined} onClick={event => { if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; event.preventDefault(); if (!saving) onTab(id); }}><Icon size={19} aria-hidden="true" /><span>{label}</span>{tab === id && <ChevronRight className="workspace-nav-arrow" size={16} aria-hidden="true" />}</a>)}</nav>
      <a className="workspace-back" href="https://guiacomararaquara.com.br/"><ArrowDownLeft size={17} />Visitar o Guia</a>
    </aside>
    <div className="workspace-main">
      <header className="workspace-topbar"><div><h1>Área do Anunciante</h1><span>Guia Comercial Araraquara</span></div><div className="workspace-account"><span className="workspace-avatar" aria-hidden="true">{data.advertiser.name.trim().slice(0, 2).toUpperCase()}</span><span className="workspace-account-name">{data.advertiser.name}</span><button type="button" onClick={onLogout} disabled={saving} className="workspace-logout"><LogOut size={17} aria-hidden="true" />Sair</button></div></header>
      <main id="advertiser-content" className="workspace-content" tabIndex={-1}>
        <div className="workspace-page-heading"><div><h2 ref={heading} tabIndex={-1}>{current.label}</h2><p>{current.description}</p></div><div className="workspace-heading-actions">{tab === "overview" && <button type="button" className="workspace-primary" onClick={() => onTab("businesses")} disabled={saving}><Building2 size={16} aria-hidden="true" />Gerenciar estabelecimentos</button>}<button type="button" className="workspace-secondary" onClick={onRefresh} disabled={loading || saving}><RefreshCw size={16} className={loading ? "animate-spin" : ""} aria-hidden="true" />Atualizar</button></div></div>
        {error && <div role="alert" className="workspace-feedback error">{error}</div>}
        {notice && !saving && <div role="status" className="workspace-feedback success"><Check size={18} aria-hidden="true" />{notice}</div>}
        {saving && <p role="status" className="workspace-feedback">{busyMessage || "Salvando alterações…"}</p>}
        <div className="workspace-body" aria-busy={loading || saving}>{children}</div>
        <footer className="workspace-footer"><span>Guia Comercial Araraquara</span><span>Conectando pessoas ao comércio local.</span></footer>
      </main>
    </div>
  </div>;
}

function currency(value: number | string) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0)); }
function date(value: string | null) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "Não informado"; }

export function AdvertiserOverview({ data, onTab, openAmount, overdueCount }: {
  data: AdvertiserPortalData; onTab: (tab: AdvertiserTab) => void; openAmount: number; overdueCount: number;
}) {
  const business = data.businesses[0];
  const checks = business ? [
    { label: "Descrição do negócio", done: Boolean(business.description?.trim()) },
    { label: "Contato para os clientes", done: Boolean(business.phone?.trim() || business.whatsapp?.trim()) },
    { label: "Endereço e bairro", done: Boolean(business.street?.trim() && business.neighborhood?.trim()) },
    { label: "Horário de atendimento", done: Boolean(business.hours?.trim()) },
    { label: "Imagem de apresentação", done: Boolean(business.image?.trim()) },
  ] : [];
  const completed = checks.filter(item => item.done).length;
  const progress = checks.length ? Math.round(completed / checks.length * 100) : 0;
  const cards = [
    { label: "Estabelecimentos", value: data.businesses.length, detail: "Vinculados à sua conta", icon: Building2, tab: "businesses" },
    { label: "Anúncios", value: data.advertisements.length, detail: `${data.advertisements.filter(item => item.status === "review").length} em revisão`, icon: Megaphone, tab: "ads" },
    { label: "Cupons válidos", value: data.coupons.filter(item => item.is_valid).length, detail: "Disponíveis para seus clientes", icon: Ticket, tab: "coupons" },
    { label: "Valores em aberto", value: currency(openAmount), detail: overdueCount ? `${overdueCount} cobrança(s) vencida(s)` : "Nenhuma cobrança vencida", icon: CreditCard, tab: "finance" },
  ] as const;
  return <div className="workspace-overview">
    <div className="workspace-stat-grid">{cards.map(({ label, value, detail, icon: Icon, tab }) => <button className="workspace-stat" key={tab} onClick={() => onTab(tab)} aria-label={`Consultar ${label.toLowerCase()}`}><div><span>{label}</span><Icon size={19} aria-hidden="true" /></div><strong>{value}</strong><small>{detail}<ChevronRight size={14} aria-hidden="true" /></small></button>)}</div>
    <div className="workspace-overview-grid"><section className="workspace-card"><div className="workspace-card-heading"><h3>Sua presença no Guia</h3><button className="workspace-text-link" onClick={() => onTab("businesses")}>Gerenciar <ArrowRight size={15} /></button></div>{business ? <><div className="workspace-business-preview">{business.image ? <img src={business.image} alt="" onError={event => { event.currentTarget.style.display = "none"; }} /> : <span className="workspace-image-fallback"><Building2 size={32} /></span>}<div><StatusBadge status={business.status} /><h4>{business.name}</h4><p><MapPin size={14} aria-hidden="true" />{[business.neighborhood, business.city].filter(Boolean).join(" · ") || "Endereço não informado"}</p><PublicBusinessLink business={business} /></div></div>{data.businesses.length > 1 && <p className="workspace-muted">E mais {data.businesses.length - 1} estabelecimento(s) na sua conta.</p>}<div className="workspace-checklist-heading"><b>Informações da página</b><span>{completed} de {checks.length} preenchidas</span></div><div className="workspace-progress" role="progressbar" aria-label={`Informações da página de ${business.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div><ul className="workspace-checklist">{checks.map(item => <li key={item.label} className={item.done ? "complete" : ""}><span aria-hidden="true">{item.done ? <Check size={12} /> : <span />}</span>{item.label}<small>{item.done ? "Preenchido" : "A completar"}</small></li>)}</ul><p className="workspace-hint">Esta conferência considera os campos preenchidos; a publicação depende do status do estabelecimento.</p></> : <WorkspaceEmpty title="Seu estabelecimento começa aqui" description="Ainda não há uma empresa vinculada a este acesso. Solicite o vínculo à equipe do Guia para gerenciar sua página." />}</section>
    <div className="workspace-side-cards"><section className="workspace-card"><div className="workspace-card-heading"><h3>Ações rápidas</h3><CircleHelp size={18} className="workspace-muted" /></div><div className="workspace-actions">{[
      { tab: "businesses" as const, icon: Building2, title: "Editar estabelecimento", text: "Confira horários, endereço e contatos." },
      { tab: "ads" as const, icon: Megaphone, title: "Gerenciar anúncios", text: "Consultar status e enviar alterações." },
      { tab: "coupons" as const, icon: Ticket, title: "Criar cupom", text: "Definir oferta, código e validade." },
    ].map(({ tab, icon: Icon, title, text }) => <button key={tab} onClick={() => onTab(tab)}><span className="workspace-action-icon"><Icon size={19} /></span><span><b>{title}</b><small>{text}</small></span><ChevronRight size={17} /></button>)}</div></section>
    <section className="workspace-card"><div className="workspace-card-heading"><h3>Situação comercial</h3><CreditCard size={18} className="workspace-muted" /></div>{data.subscriptions.length ? <div className="workspace-contracts">{data.subscriptions.map(item => <div key={item.id}><div><b>{item.plan_name}</b><StatusBadge status={item.status} /></div><p>{item.business_name}</p><div><strong>{currency(item.agreed_price)}</strong><small>Próximo vencimento<br />{date(item.next_due_date)}</small></div></div>)}</div> : <p className="workspace-muted">Nenhum contrato cadastrado. Quando houver uma contratação, os detalhes aparecerão aqui.</p>}<button className="workspace-text-link workspace-finance-link" onClick={() => onTab("finance")}>Consultar financeiro <ArrowRight size={15} /></button></section></div></div>
  </div>;
}

export function WorkspaceEmpty({ title, description }: { title: string; description: string }) {
  return <div className="workspace-empty"><span><Store size={28} strokeWidth={1.5} /></span><h3>{title}</h3><p>{description}</p></div>;
}
