import { useState } from "react";
import { Megaphone, Pencil, Send } from "lucide-react";
import { Advertisement, submitAdvertiserAdvertisement } from "../../api";
import { StatusBadge, WorkspaceEmpty } from "../AdvertiserWorkspace";
import { confirmDiscard, dateLabel, EditorHeading, EditorProps, Field, FormSection, matches, NoResults, SaveBar, SearchField, SectionSummary, useDirty } from "./shared";

const adFields = ({ title, short_description, description, call_to_action, destination_url, video_url }: Advertisement) => ({ title, short_description, description, call_to_action, destination_url, video_url });
export function AdsSection({ advertisements, saving, onSave, onDirtyChange }: EditorProps & { advertisements: Advertisement[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Advertisement | null>(null);
  const [draft, setDraft] = useState<ReturnType<typeof adFields> | null>(null);
  const dirty = Boolean(selected && draft && JSON.stringify(draft) !== JSON.stringify(adFields(selected)));
  useDirty(dirty, onDirtyChange);
  const back = () => { if (!saving && confirmDiscard(dirty)) { setSelected(null); setDraft(null); } };
  const visible = advertisements.filter(item => (!status || item.status === status) && matches(query, item.title, item.business_name));
  if (selected && draft) {
    const set = (key: keyof typeof draft, value: string) => setDraft(current => current && ({ ...current, [key]: value }));
    return <div className="advertiser-detail-layout"><form className="advertiser-editor" onSubmit={async event => { event.preventDefault(); if (await onSave(() => submitAdvertiserAdvertisement(selected.id, draft), "Alterações enviadas para revisão.")) { setSelected(null); setDraft(null); } }}><EditorHeading title="Editar anúncio" detail={selected.business_name} onBack={back} saving={saving} /><fieldset disabled={saving}>
      <div className="advertiser-inline-note"><Send size={18} /><p>Ao enviar, o anúncio ficará em revisão pela equipe do Guia. A publicação depende da aprovação.</p></div>
      <FormSection title="Conteúdo do anúncio" description="Use uma mensagem objetiva. O título é obrigatório.">
        <Field label="Título *" wide><input required value={draft.title} onChange={e => set("title", e.target.value)} /></Field>
        <Field label="Chamada curta" wide><input value={draft.short_description} onChange={e => set("short_description", e.target.value)} /></Field>
        <Field label="Texto do anúncio" wide><textarea rows={6} value={draft.description} onChange={e => set("description", e.target.value)} /></Field>
      </FormSection>
      <FormSection title="Ação e destino" description="Defina o convite ao cliente e o endereço de destino, quando houver.">
        <Field label="Chamada para ação"><input value={draft.call_to_action} onChange={e => set("call_to_action", e.target.value)} placeholder="Ex.: Peça um orçamento" /></Field>
        <Field label="Link de destino"><input type="url" placeholder="https://" value={draft.destination_url} onChange={e => set("destination_url", e.target.value)} /></Field>
        <Field label="Link do vídeo" wide><input type="url" placeholder="https://" value={draft.video_url} onChange={e => set("video_url", e.target.value)} /></Field>
      </FormSection><SaveBar saving={saving} dirty={dirty} label="Enviar para revisão" onCancel={back} /></fieldset></form>
      <aside className="advertiser-detail-aside"><section className="workspace-card advertiser-ad-preview"><h3>Prévia do conteúdo</h3>{selected.cover_image && <img className="advertiser-aside-image" src={selected.cover_image} alt="Imagem atual do anúncio" />}<span className="advertiser-preview-business">{selected.business_name}</span><h4>{draft.title || "Título do anúncio"}</h4><b>{draft.short_description}</b><p>{draft.description || "O texto do anúncio aparecerá aqui."}</p>{draft.call_to_action && <span className="advertiser-preview-cta">{draft.call_to_action}</span>}<small>Prévia de texto para conferência; a apresentação pública pode variar.</small></section><section className="advertiser-guidance"><h3>Status atual</h3><StatusBadge status={selected.status} /><p>As alterações serão avaliadas após o envio. Você pode acompanhar o status nesta página.</p></section></aside></div>;
  }
  return <section className="advertiser-section"><SectionSummary items={[{ label: "Anúncios cadastrados", value: advertisements.length }, { label: "Publicados", value: advertisements.filter(item => item.status === "published").length }, { label: "Em revisão", value: advertisements.filter(item => item.status === "review").length }]} />
    {advertisements.length > 0 && <div className="advertiser-toolbar"><SearchField label="Buscar anúncio" value={query} onChange={setQuery} /><label className="advertiser-filter">Status do anúncio<select aria-label="Status do anúncio" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos os status</option><option value="published">Publicado</option><option value="review">Em revisão</option><option value="draft">Rascunho</option><option value="paused">Pausado</option><option value="ended">Encerrado</option></select></label><span className="advertiser-result-count">{visible.length} de {advertisements.length}</span></div>}
    <div className="advertiser-record-list">{visible.map(ad => <article key={ad.id} className="advertiser-business-card"><div className="advertiser-record-top"><span className="advertiser-record-placeholder"><Megaphone size={26} /></span><div><StatusBadge status={ad.status} /><h3>{ad.title}</h3><p>{ad.business_name}</p></div><button className="workspace-secondary" onClick={() => { setSelected(ad); setDraft(adFields(ad)); }}><Pencil size={15} />Editar anúncio</button></div><p className="advertiser-ad-description">{ad.short_description || ad.description || "Sem descrição cadastrada."}</p><dl className="advertiser-record-facts"><div><dt>Tipo</dt><dd>{ad.is_primary ? "Anúncio principal" : "Anúncio adicional"}</dd></div><div><dt>Início</dt><dd>{dateLabel(ad.starts_at)}</dd></div><div><dt>Término</dt><dd>{ad.ends_at ? dateLabel(ad.ends_at) : "Sem data definida"}</dd></div></dl>{ad.status === "review" && <p className="advertiser-record-note">Aguardando revisão da equipe do Guia.</p>}</article>)}</div>
    {!advertisements.length ? <div className="workspace-card"><WorkspaceEmpty title="Nenhum anúncio cadastrado" description="Quando a equipe do Guia vincular um anúncio à sua empresa, você poderá editar o conteúdo e acompanhar sua revisão por aqui." /></div> : !visible.length && <NoResults onClear={() => { setQuery(""); setStatus(""); }} />}
  </section>;
}
