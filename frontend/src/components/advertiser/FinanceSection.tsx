import { useEffect, useRef, useState } from "react";
import { CreditCard, FileText, X } from "lucide-react";
import { Invoice } from "../../api";
import { StatusBadge, WorkspaceEmpty } from "../AdvertiserWorkspace";
import { dateLabel, invoiceStatus, matches, money, NoResults, paymentLabel, SearchField, SectionSummary } from "./shared";

export function FinanceSection({ invoices }: { invoices: Invoice[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [month, setMonth] = useState("");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const open = invoices.filter(item => ["open", "overdue"].includes(item.status));
  const sum = (values: Invoice[]) => values.reduce((total, item) => total + Number(item.total), 0);
  const visible = invoices.filter(item => (!status || invoiceStatus(item) === status) && (!month || item.due_date.startsWith(month)) && matches(query, item.description, item.business_name, item.reference_month)).sort((a, b) => a.due_date.localeCompare(b.due_date) || a.id - b.id);
  return <section className="advertiser-section">
    <div className="workspace-finance-summary advertiser-finance-summary"><SectionSummary items={[{ label: "Valores em aberto", value: money(sum(open)) }, { label: "Total vencido", value: money(sum(open.filter(item => invoiceStatus(item) === "overdue"))), tone: "attention" }, { label: "Total pago registrado", value: money(sum(invoices.filter(item => item.status === "paid"))) }, { label: "Cobranças cadastradas", value: invoices.length }]} /></div>
    <div className="advertiser-toolbar"><SearchField label="Buscar cobrança ou estabelecimento" value={query} onChange={setQuery} /><label className="advertiser-filter">Status da cobrança<select aria-label="Status da cobrança" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos os status</option><option value="open">Em aberto</option><option value="overdue">Vencido</option><option value="paid">Pago</option><option value="cancelled">Cancelado</option></select></label><label className="advertiser-filter">Mês de vencimento<input type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>{(query || status || month) && <button className="workspace-text-link" onClick={() => { setQuery(""); setStatus(""); setMonth(""); }}>Limpar filtros</button>}</div>
    <section className="advertiser-finance-records" aria-label="Histórico financeiro"><div className="advertiser-list-heading"><h3><FileText size={18} />Histórico de cobranças</h3><span>{visible.length} registro(s)</span></div>
      {visible.length > 0 && <div className="workspace-table-scroll"><table className="advertiser-finance-table"><thead><tr><th scope="col">Referência / estabelecimento</th><th scope="col">Vencimento</th><th scope="col">Valor</th><th scope="col">Status</th><th scope="col">Pagamento</th><th scope="col"><span className="sr-only">Detalhes</span></th></tr></thead><tbody>{visible.map(invoice => <tr key={invoice.id}><td data-label="Referência"><b>{invoice.description || invoice.reference_month}</b><small>{invoice.business_name}</small></td><td data-label="Vencimento">{dateLabel(invoice.due_date)}</td><td data-label="Valor"><strong>{money(invoice.total)}</strong></td><td data-label="Status"><StatusBadge status={invoiceStatus(invoice)} /></td><td data-label="Pagamento">{paymentLabel(invoice.payment_method)}</td><td><button className="workspace-text-link" onClick={() => setSelected(invoice)} aria-label={`Ver detalhes: ${invoice.description || invoice.reference_month}`}>Ver detalhes</button></td></tr>)}</tbody></table></div>}
      {!invoices.length ? <WorkspaceEmpty title="Nenhuma cobrança cadastrada." description="Quando houver cobranças, você poderá consultar os valores, os vencimentos e os pagamentos registrados aqui." /> : !visible.length && <NoResults onClear={() => { setQuery(""); setStatus(""); setMonth(""); }} />}
    </section>
    <p className="advertiser-inline-note"><CreditCard size={18} />Os pagamentos on-line ainda não estão disponíveis. Este espaço exibe os registros financeiros da sua conta.</p>
    {selected && <InvoiceDialog invoice={selected} onClose={() => setSelected(null)} />}
  </section>;
}
function InvoiceDialog({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const element = dialog.current!;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialog} className="advertiser-invoice-dialog" aria-labelledby="invoice-dialog-title" onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose(); }}><div><header><div><span>DETALHES DA COBRANÇA</span><h3 id="invoice-dialog-title">{invoice.description || invoice.reference_month}</h3></div><button className="workspace-secondary" onClick={onClose} aria-label="Fechar detalhes"><X size={18} /></button></header><StatusBadge status={invoiceStatus(invoice)} /><dl className="advertiser-facts"><div><dt>Estabelecimento</dt><dd>{invoice.business_name}</dd></div><div><dt>Referência</dt><dd>{dateLabel(invoice.reference_month)}</dd></div><div><dt>Vencimento</dt><dd>{dateLabel(invoice.due_date)}</dd></div><div><dt>Valor original</dt><dd>{money(invoice.amount)}</dd></div><div><dt>Desconto</dt><dd>{money(invoice.discount)}</dd></div><div><dt>Encargos</dt><dd>{money(invoice.late_fee)}</dd></div><div className="advertiser-invoice-total"><dt>Total</dt><dd>{money(invoice.total)}</dd></div><div><dt>Pagamento registrado</dt><dd>{invoice.paid_at ? dateLabel(invoice.paid_at) : "Não registrado"}</dd></div><div><dt>Meio de pagamento</dt><dd>{paymentLabel(invoice.payment_method)}</dd></div>{invoice.external_reference && <div><dt>Referência do pagamento</dt><dd>{invoice.external_reference}</dd></div>}</dl><button className="workspace-primary" onClick={onClose}>Fechar</button></div></dialog>;
}
