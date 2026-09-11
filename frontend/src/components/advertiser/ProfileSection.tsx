import { useEffect, useState } from "react";
import { Building2, Mail, UserRound } from "lucide-react";
import { AdvertiserPortalData, updateAdvertiserProfile } from "../../api";
import { StatusBadge } from "../AdvertiserWorkspace";
import { confirmDiscard, EditorProps, Field, FormSection, SaveBar, useDirty } from "./shared";

const profileFields = (data: AdvertiserPortalData) => {
  const { name, document, contact_name, phone, email, billing_email } = data.advertiser;
  return { name, document, contact_name, phone, email, billing_email };
};
export function ProfileSection({ data, saving, onSave, onDirtyChange }: EditorProps & { data: AdvertiserPortalData }) {
  const [draft, setDraft] = useState(() => profileFields(data));
  useEffect(() => setDraft(profileFields(data)), [data.advertiser]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(profileFields(data));
  useDirty(dirty, onDirtyChange);
  const set = (key: keyof typeof draft, value: string) => setDraft(current => ({ ...current, [key]: value }));
  return <div className="advertiser-detail-layout">
    <form className="advertiser-editor" onSubmit={event => { event.preventDefault(); void onSave(() => updateAdvertiserProfile(draft), "Cadastro atualizado."); }}>
      <div className="advertiser-editor-heading"><h3>Dados do anunciante</h3><p>Informações da conta e do responsável. Campos com * são obrigatórios.</p></div>
      <fieldset disabled={saving}>
        <FormSection title="Identificação" description="Dados usados para identificar o anunciante junto ao Guia.">
          <Field label="Nome ou razão social *" wide><input required autoComplete="organization" value={draft.name} onChange={e => set("name", e.target.value)} /></Field>
          <Field label="CPF/CNPJ"><input inputMode="numeric" value={draft.document} onChange={e => set("document", e.target.value)} /></Field>
          <Field label="Responsável"><input autoComplete="name" value={draft.contact_name} onChange={e => set("contact_name", e.target.value)} /></Field>
        </FormSection>
        <FormSection title="Contato da conta" description="Como a equipe do Guia pode falar com o responsável pelo cadastro.">
          <Field label="Telefone/WhatsApp"><input type="tel" autoComplete="tel" value={draft.phone} onChange={e => set("phone", e.target.value)} /></Field>
          <Field label="E-mail de contato"><input type="email" autoComplete="email" value={draft.email} onChange={e => set("email", e.target.value)} /></Field>
        </FormSection>
        <FormSection title="Contato financeiro" description="Endereço de e-mail do responsável pelas informações financeiras.">
          <Field label="E-mail financeiro" wide><input type="email" value={draft.billing_email} onChange={e => set("billing_email", e.target.value)} /></Field>
        </FormSection>
        <SaveBar saving={saving} dirty={dirty} label="Salvar dados" onCancel={() => { if (confirmDiscard(dirty)) setDraft(profileFields(data)); }} />
      </fieldset>
    </form>
    <aside className="advertiser-detail-aside"><section className="workspace-card"><h3><UserRound size={18} />Sua conta</h3><StatusBadge status={data.advertiser.status} /><dl className="advertiser-facts"><div><dt>Anunciante</dt><dd>{data.advertiser.name}</dd></div><div><dt>Estabelecimentos vinculados</dt><dd>{data.businesses.length}</dd></div></dl></section><section className="advertiser-guidance"><Building2 size={21} /><h3>Dados exibidos aos clientes</h3><p>O telefone, o endereço e os horários da página pública são editados em Estabelecimentos.</p></section><section className="advertiser-guidance"><Mail size={21} /><h3>Contatos separados</h3><p>O contato da conta pode ser diferente do contato da empresa. Confira ambos quando houver mudança de responsável.</p></section></aside>
  </div>;
}
