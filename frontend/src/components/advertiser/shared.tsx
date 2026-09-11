import { cloneElement, isValidElement, ReactNode, useEffect, useId } from "react";
import { ArrowLeft, Search, Save } from "lucide-react";
import { Invoice } from "../../api";
import { todayInAraraquara } from "../AdvertiserWorkspace";

export interface EditorProps {
  saving: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onSave: (action: () => Promise<unknown>, message: string) => Promise<boolean>;
}
export function useDirty(dirty: boolean, report: (dirty: boolean) => void) {
  useEffect(() => { report(dirty); return () => report(false); }, [dirty, report]);
}
export const money = (value: string | number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
export function dateLabel(value: string | null | undefined) {
  if (!value) return "Não informado";
  const day = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(day.getTime()) ? "Não informado" : day.toLocaleDateString("pt-BR");
}
export const invoiceStatus = (invoice: Invoice) => invoice.status === "open" && invoice.due_date < todayInAraraquara() ? "overdue" : invoice.status;
export const paymentLabel = (method: string) => ({ pix: "PIX", boleto: "Boleto", card: "Cartão", cash: "Dinheiro", transfer: "Transferência", other: "Outro" } as Record<string, string>)[method] || "Não registrado";
export const matches = (query: string, ...values: (string | null | undefined)[]) => {
  const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return fold(values.filter(Boolean).join(" ")).includes(fold(query.trim()));
};
export const confirmDiscard = (dirty: boolean) => !dirty || window.confirm("Descartar as alterações não salvas?");

export function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: ReactNode }) {
  const id = useId();
  const control = isValidElement<{ id?: string; "aria-describedby"?: string }>(children) ? cloneElement(children, { id, "aria-describedby": hint ? `${id}-hint` : undefined }) : children;
  return <div className={`advertiser-field${wide ? " wide" : ""}`}><label htmlFor={id}>{label}</label>{control}{hint && <small id={`${id}-hint`}>{hint}</small>}</div>;
}
export function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="advertiser-form-section"><div className="advertiser-section-title"><h3>{title}</h3><p>{description}</p></div><div className="advertiser-form-grid">{children}</div></section>;
}
export function SaveBar({ saving, dirty, label = "Salvar alterações", onCancel }: { saving: boolean; dirty: boolean; label?: string; onCancel: () => void }) {
  return <div className="advertiser-savebar"><span>{dirty ? "Alterações ainda não salvas" : "Dados atualizados"}</span><div><button type="button" className="workspace-secondary" disabled={saving} onClick={onCancel}>Cancelar</button><button type="submit" className="workspace-primary" disabled={saving || !dirty}><Save size={16} aria-hidden="true" />{saving ? "Salvando…" : label}</button></div></div>;
}
export function EditorHeading({ title, detail, onBack, saving }: { title: string; detail: string; onBack: () => void; saving?: boolean }) {
  return <div className="advertiser-editor-heading"><button className="workspace-text-link" type="button" disabled={saving} onClick={onBack}><ArrowLeft size={16} />Voltar à lista</button><h3>{title}</h3><p>{detail}</p></div>;
}
export function SearchField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <label className="advertiser-search"><Search size={17} aria-hidden="true" /><span className="sr-only">{label}</span><input type="search" placeholder={label} value={value} onChange={event => onChange(event.target.value)} /></label>;
}
export function SectionSummary({ items }: { items: { label: string; value: string | number; tone?: string }[] }) {
  return <div className="advertiser-section-summary">{items.map(item => <div key={item.label} className={item.tone || ""}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>;
}
export function NoResults({ onClear }: { onClear: () => void }) {
  return <div className="advertiser-no-results"><h3>Nenhum resultado para estes filtros</h3><p>Ajuste a busca ou remova os filtros para ver os registros.</p><button className="workspace-secondary" onClick={onClear}>Limpar filtros</button></div>;
}
