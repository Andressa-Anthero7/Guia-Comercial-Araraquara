import { ReactNode, useState } from "react";
import { Building2, Clock3, MapPin, Pencil, Phone } from "lucide-react";
import { updateAdvertiserBusiness } from "../../api";
import { Business } from "../../types";
import { PublicBusinessLink, StatusBadge, WorkspaceEmpty } from "../AdvertiserWorkspace";
import { confirmDiscard, EditorHeading, EditorProps, Field, FormSection, matches, NoResults, SaveBar, SearchField, SectionSummary, useDirty } from "./shared";

export interface BusinessExtras { renderPhotos?: (business: Business, onChange: (business: Business) => void, disabled: boolean) => ReactNode }
export function BusinessesSection({ businesses, saving, onSave, onDirtyChange, renderPhotos }: EditorProps & BusinessExtras & { businesses: Business[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState<Business | null>(null);
  const original = businesses.find(item => item.id === draft?.id);
  const dirty = Boolean(draft && original && JSON.stringify(draft) !== JSON.stringify(original));
  useDirty(dirty, onDirtyChange);
  const back = () => { if (!saving && confirmDiscard(dirty)) setDraft(null); };
  const visible = businesses.filter(item => (!status || (item.status || "active") === status) && matches(query, item.name, item.neighborhood, item.street));
  if (draft) {
    const set = (key: keyof Business, value: string) => setDraft(current => current && ({ ...current, [key]: value }));
    return <div className="advertiser-detail-layout"><form className="advertiser-editor" onSubmit={async event => { event.preventDefault(); if (await onSave(() => updateAdvertiserBusiness(draft), "Dados do estabelecimento atualizados.")) setDraft(null); }}>
      <EditorHeading title={draft.name} detail="Edite as informações da página pública. Campos com * são obrigatórios." onBack={back} saving={saving} />
      <fieldset disabled={saving}>
        <FormSection title="Apresentação" description="Explique o que a empresa oferece e como pode ajudar seus clientes.">
          <Field label="Nome *" wide><input required value={draft.name} onChange={e => set("name", e.target.value)} /></Field>
          <Field label="Descrição *" wide><textarea required rows={5} value={draft.description} onChange={e => set("description", e.target.value)} /></Field>
          <Field label="Produtos e serviços" wide hint="Separe os principais produtos e serviços em linhas para facilitar a leitura."><textarea rows={4} value={draft.servicesProducts || ""} onChange={e => set("servicesProducts", e.target.value)} /></Field>
        </FormSection>
        <FormSection title="Contato e atendimento" description="Informe os canais e horários que os clientes podem usar.">
          <Field label="Telefone comercial"><input type="tel" value={draft.phone} onChange={e => set("phone", e.target.value)} /></Field>
          <Field label="WhatsApp *"><input required type="tel" value={draft.whatsapp} onChange={e => set("whatsapp", e.target.value)} /></Field>
          <Field label="E-mail"><input type="email" value={draft.email || ""} onChange={e => set("email", e.target.value)} /></Field>
          <Field label="Horário de atendimento"><input value={draft.hours} onChange={e => set("hours", e.target.value)} placeholder="Ex.: segunda a sexta, das 8h às 18h" /></Field>
        </FormSection>
        <FormSection title="Endereço" description="Confira a localização completa para facilitar a visita dos clientes.">
          <Field label="Rua"><input autoComplete="address-line1" value={draft.street || ""} onChange={e => set("street", e.target.value)} /></Field>
          <Field label="Número"><input value={draft.number || ""} onChange={e => set("number", e.target.value)} /></Field>
          <Field label="Complemento"><input autoComplete="address-line2" value={draft.complement || ""} onChange={e => set("complement", e.target.value)} /></Field>
          <Field label="Bairro"><input value={draft.neighborhood} onChange={e => set("neighborhood", e.target.value)} /></Field>
          <Field label="Cidade"><input autoComplete="address-level2" value={draft.city || ""} onChange={e => set("city", e.target.value)} /></Field>
          <Field label="UF"><input maxLength={2} autoComplete="address-level1" value={draft.state || ""} onChange={e => set("state", e.target.value.toUpperCase())} /></Field>
          <Field label="CEP"><input inputMode="numeric" autoComplete="postal-code" value={draft.postalCode || ""} onChange={e => set("postalCode", e.target.value)} /></Field>
        </FormSection>
        <FormSection title="Presença digital" description="Links para os canais oficiais da empresa.">
          <Field label="Site"><input type="url" placeholder="https://" value={draft.website || ""} onChange={e => set("website", e.target.value)} /></Field>
          <Field label="Instagram"><input value={draft.instagram || ""} onChange={e => set("instagram", e.target.value)} /></Field>
        </FormSection>
        {renderPhotos?.(draft, setDraft, saving)}
        <SaveBar saving={saving} dirty={dirty} label="Salvar" onCancel={back} />
      </fieldset>
    </form><aside className="advertiser-detail-aside"><section className="workspace-card"><h3><Building2 size={18} />Página da empresa</h3>{draft.image && <img className="advertiser-aside-image" src={draft.image} alt="Imagem atual da empresa" />}<StatusBadge status={original?.status} /><p className="workspace-muted">{original?.name}</p>{original && <PublicBusinessLink business={original} />}</section><section className="advertiser-guidance"><h3>Antes de salvar</h3><p>Revise principalmente o WhatsApp, o endereço e o horário de atendimento. Essas informações orientam o contato dos clientes.</p></section></aside></div>;
  }
  return <section className="advertiser-section">
    <SectionSummary items={[{ label: "Estabelecimentos", value: businesses.length }, { label: "Ativos", value: businesses.filter(item => item.status === "active").length }, { label: "Em análise", value: businesses.filter(item => item.status === "pending").length }]} />
    {businesses.length > 0 && <div className="advertiser-toolbar"><SearchField label="Buscar estabelecimento" value={query} onChange={setQuery} /><label className="advertiser-filter">Status do estabelecimento<select aria-label="Status do estabelecimento" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos os status</option><option value="active">Ativo</option><option value="pending">Em análise</option><option value="draft">Rascunho</option><option value="suspended">Suspenso</option><option value="inactive">Inativo</option></select></label><span className="advertiser-result-count">{visible.length} de {businesses.length}</span></div>}
    <div className="advertiser-record-list">{visible.map(business => <article key={business.id} className="advertiser-business-card"><div className="advertiser-record-top">{business.image ? <img src={business.image} alt="" /> : <span className="advertiser-record-placeholder"><Building2 size={26} /></span>}<div><StatusBadge status={business.status} /><h3>{business.name}</h3><p><MapPin size={14} />{[business.street, business.number, business.neighborhood].filter(Boolean).join(", ") || "Endereço não informado"}</p></div><button className="workspace-secondary" onClick={() => setDraft({ ...business })}><Pencil size={15} />Editar dados</button></div><dl className="advertiser-record-facts"><div><dt><Phone size={14} />WhatsApp</dt><dd>{business.whatsapp || "Não informado"}</dd></div><div><dt><Clock3 size={14} />Atendimento</dt><dd>{business.hours || "Não informado"}</dd></div><div><dt>Página pública</dt><dd>{business.status === "active" ? <PublicBusinessLink business={business} /> : "Disponível após ativação"}</dd></div></dl></article>)}</div>
    {!businesses.length ? <div className="workspace-card"><WorkspaceEmpty title="Nenhum estabelecimento vinculado" description="Solicite à equipe do Guia o vínculo da sua empresa com este acesso para gerenciar sua página." /></div> : !visible.length && <NoResults onClear={() => { setQuery(""); setStatus(""); }} />}
  </section>;
}
