import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, BadgeDollarSign, Building2, CalendarClock, CheckCircle2,
  CreditCard, PlusCircle, RefreshCw, Users
} from "lucide-react";
import { Business } from "../types";
import {
  Advertiser, AdvertisingPlan, AdvertisingSubscription, FinanceSummary, Invoice,
  loadFinanceData, saveAdvertiser, saveAdvertisingPlan,
  saveAdvertisingSubscription, saveInvoice
} from "../api";

type Tab = "overview" | "advertisers" | "plans" | "subscriptions" | "invoices";
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => `${today().slice(0, 7)}-01`;
const money = (value: string | number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

const emptySummary: FinanceSummary = {
  active_advertisers: 0, active_subscriptions: 0, open_amount: 0,
  overdue_amount: 0, overdue_count: 0, due_soon_count: 0, received_this_month: 0
};

export function FinanceBackoffice({ businesses }: { businesses: Business[] }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState(emptySummary);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [plans, setPlans] = useState<AdvertisingPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdvertisingSubscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [advertiserForm, setAdvertiserForm] = useState<Advertiser>({
    id: 0, user: null, businesses: [], business_names: [], name: "", document: "",
    contact_name: "", email: "", phone: "", billing_email: "", status: "active", notes: ""
  });
  const [planForm, setPlanForm] = useState<AdvertisingPlan>({
    id: 0, name: "", description: "", price: "0.00", billing_cycle: "monthly",
    max_ads: 1, featured: false, is_active: true
  });
  const [subscriptionForm, setSubscriptionForm] = useState<AdvertisingSubscription>({
    id: 0, advertiser: 0, advertiser_name: "", business: 0, business_name: "", advertisement: null,
    plan: 0, plan_name: "", start_date: today(), end_date: null, next_due_date: today(),
    agreed_price: "0.00", status: "active", auto_renew: true, notes: ""
  });
  const [invoiceForm, setInvoiceForm] = useState<Invoice>({
    id: 0, subscription: 0, advertiser_name: "", business_name: "", description: "",
    reference_month: monthStart(), due_date: today(), amount: "0.00", discount: "0.00",
    late_fee: "0.00", total: "0.00", status: "open", paid_at: null,
    payment_method: "", external_reference: "", notes: ""
  });

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await loadFinanceData();
      setSummary(data.summary);
      setAdvertisers(data.advertisers);
      setPlans(data.plans);
      setSubscriptions(data.subscriptions);
      setInvoices(data.invoices);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel carregar o financeiro.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void reload(); }, []);

  const overdueInvoices = useMemo(
    () => invoices.filter((item) => item.status === "overdue" || (item.status === "open" && item.due_date < today())),
    [invoices]
  );

  const submit = async (event: FormEvent, action: () => Promise<unknown>, reset: () => void) => {
    event.preventDefault();
    setError("");
    try {
      await action();
      reset();
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel salvar.");
    }
  };

  const selectAdvertiserBusinesses = (event: ChangeEvent<HTMLSelectElement>) => {
    const selected: number[] = [];
    const options = event.currentTarget.options;
    for (let index = 0; index < options.length; index += 1) {
      if (options[index].selected) selected.push(Number(options[index].value));
    }
    setAdvertiserForm({ ...advertiserForm, businesses: selected });
  };

  const markInvoicePaid = async (invoice: Invoice) => {
    setError("");
    try {
      await saveInvoice({
        ...invoice,
        status: "paid",
        paid_at: today(),
        payment_method: invoice.payment_method || "pix"
      });
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel registrar o pagamento.");
    }
  };

  const field = "h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100";
  const cards = [
    { label: "Recebido no mes", value: money(summary.received_this_month), icon: CheckCircle2, tone: "text-emerald-600" },
    { label: "Em aberto", value: money(summary.open_amount), icon: CreditCard, tone: "text-blue-600" },
    { label: "Em atraso", value: money(summary.overdue_amount), icon: AlertTriangle, tone: "text-rose-600" },
    { label: "Assinaturas ativas", value: summary.active_subscriptions, icon: BadgeDollarSign, tone: "text-amber-600" }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-stone-950">Controle financeiro</h2>
          <p className="text-sm text-stone-500">Anunciantes, planos, contratos, vencimentos e recebimentos.</p>
        </div>
        <button onClick={() => void reload()} className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-bold">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Atualizar
        </button>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-stone-200 bg-white p-2">
        {([
          ["overview", "Visao geral"], ["advertisers", "Anunciantes"], ["plans", "Planos"],
          ["subscriptions", "Assinaturas"], ["invoices", "Cobrancas"]
        ] as Array<[Tab, string]>).map(([value, label]) => (
          <button key={value} onClick={() => setTab(value)}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold ${tab === value ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-50"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, icon: Icon, tone }) => (
              <div key={label} className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between text-sm font-semibold text-stone-500">
                  {label}<Icon className={`h-5 w-5 ${tone}`} />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-stone-950">{value}</div>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <h3 className="font-extrabold">Alertas</h3>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between rounded-md bg-rose-50 p-3 text-rose-700"><span>Cobrancas vencidas</span><b>{summary.overdue_count}</b></div>
                <div className="flex justify-between rounded-md bg-amber-50 p-3 text-amber-700"><span>Vencem nos proximos 7 dias</span><b>{summary.due_soon_count}</b></div>
                <div className="flex justify-between rounded-md bg-stone-50 p-3"><span>Anunciantes ativos</span><b>{summary.active_advertisers}</b></div>
              </div>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-4">
              <h3 className="font-extrabold">Inadimplencia recente</h3>
              <div className="mt-3 space-y-2">
                {overdueInvoices.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex justify-between border-b border-stone-100 pb-2 text-sm">
                    <span><b>{item.advertiser_name}</b><br/><small className="text-stone-500">{item.business_name} · {item.due_date}</small></span>
                    <b className="text-rose-600">{money(item.total)}</b>
                  </div>
                ))}
                {!overdueInvoices.length && <p className="text-sm text-stone-500">Nenhuma cobranca vencida.</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "advertisers" && (
        <CrudSection title="Novo anunciante" icon={<Users className="h-5 w-5" />}
          form={
            <form onSubmit={(event) => void submit(event, () => saveAdvertiser(advertiserForm), () => setAdvertiserForm({...advertiserForm, id: 0, name: "", document: "", contact_name: "", email: "", phone: "", billing_email: "", businesses: [], business_names: [], notes: ""}))} className="grid gap-3 md:grid-cols-2">
              <input required className={field} placeholder="Nome ou razao social" value={advertiserForm.name} onChange={e => setAdvertiserForm({...advertiserForm, name:e.target.value})}/>
              <input className={field} placeholder="CPF/CNPJ" value={advertiserForm.document} onChange={e => setAdvertiserForm({...advertiserForm, document:e.target.value})}/>
              <input className={field} placeholder="Responsavel" value={advertiserForm.contact_name} onChange={e => setAdvertiserForm({...advertiserForm, contact_name:e.target.value})}/>
              <input className={field} placeholder="Telefone/WhatsApp" value={advertiserForm.phone} onChange={e => setAdvertiserForm({...advertiserForm, phone:e.target.value})}/>
              <input type="email" className={field} placeholder="E-mail" value={advertiserForm.email} onChange={e => setAdvertiserForm({...advertiserForm, email:e.target.value})}/>
              <input type="email" className={field} placeholder="E-mail financeiro" value={advertiserForm.billing_email} onChange={e => setAdvertiserForm({...advertiserForm, billing_email:e.target.value})}/>
              <select multiple className={`${field} h-24 md:col-span-2`} value={advertiserForm.businesses.map(String)}
                onChange={selectAdvertiserBusinesses}>
                {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white"><PlusCircle className="h-4 w-4"/>Salvar anunciante</button>
            </form>
          }>
          <DataTable headers={["Anunciante","Contato","Anuncios","Status"]}>
            {advertisers.map(item => <tr key={item.id} className="border-t text-sm"><td className="p-3 font-bold">{item.name}<div className="text-xs font-normal text-stone-500">{item.document}</div></td><td className="p-3">{item.contact_name}<div className="text-xs text-stone-500">{item.phone}</div></td><td className="p-3">{item.business_names.join(", ") || "Nenhum"}</td><td className="p-3">{item.status}</td></tr>)}
          </DataTable>
        </CrudSection>
      )}

      {tab === "plans" && (
        <CrudSection title="Novo plano" icon={<BadgeDollarSign className="h-5 w-5"/>}
          form={<form onSubmit={(event) => void submit(event, () => saveAdvertisingPlan(planForm), () => setPlanForm({...planForm,id:0,name:"",description:"",price:"0.00"}))} className="grid gap-3 md:grid-cols-3">
            <input required className={field} placeholder="Nome do plano" value={planForm.name} onChange={e=>setPlanForm({...planForm,name:e.target.value})}/>
            <input required type="number" min="0" step="0.01" className={field} placeholder="Valor" value={planForm.price} onChange={e=>setPlanForm({...planForm,price:e.target.value})}/>
            <select className={field} value={planForm.billing_cycle} onChange={e=>setPlanForm({...planForm,billing_cycle:e.target.value as AdvertisingPlan["billing_cycle"]})}><option value="monthly">Mensal</option><option value="quarterly">Trimestral</option><option value="semiannual">Semestral</option><option value="annual">Anual</option></select>
            <input type="number" min="1" className={field} value={planForm.max_ads} onChange={e=>setPlanForm({...planForm,max_ads:Number(e.target.value)})}/>
            <input className={`${field} md:col-span-2`} placeholder="Descricao e beneficios" value={planForm.description} onChange={e=>setPlanForm({...planForm,description:e.target.value})}/>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={planForm.featured} onChange={e=>setPlanForm({...planForm,featured:e.target.checked})}/>Inclui destaque no portal</label>
            <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white">Salvar plano</button>
          </form>}>
          <DataTable headers={["Plano","Ciclo","Valor","Anuncios","Destaque"]}>{plans.map(item=><tr key={item.id} className="border-t text-sm"><td className="p-3 font-bold">{item.name}</td><td className="p-3">{item.billing_cycle}</td><td className="p-3">{money(item.price)}</td><td className="p-3">{item.max_ads}</td><td className="p-3">{item.featured?"Sim":"Nao"}</td></tr>)}</DataTable>
        </CrudSection>
      )}

      {tab === "subscriptions" && (
        <CrudSection title="Nova assinatura de anuncio" icon={<CalendarClock className="h-5 w-5"/>}
          form={<form onSubmit={(event)=>void submit(event,()=>saveAdvertisingSubscription(subscriptionForm),()=>setSubscriptionForm({...subscriptionForm,id:0,advertiser:0,business:0,plan:0,agreed_price:"0.00"}))} className="grid gap-3 md:grid-cols-3">
            <select required className={field} value={subscriptionForm.advertiser} onChange={e=>setSubscriptionForm({...subscriptionForm,advertiser:Number(e.target.value)})}><option value={0}>Anunciante</option>{advertisers.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
            <select required className={field} value={subscriptionForm.business} onChange={e=>setSubscriptionForm({...subscriptionForm,business:Number(e.target.value)})}><option value={0}>Anuncio/estabelecimento</option>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
            <select required className={field} value={subscriptionForm.plan} onChange={e=>{const plan=plans.find(p=>p.id===Number(e.target.value));setSubscriptionForm({...subscriptionForm,plan:Number(e.target.value),agreed_price:plan?.price??subscriptionForm.agreed_price})}}><option value={0}>Plano</option>{plans.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <label className="text-xs font-bold text-stone-500">Inicio<input required type="date" className={`${field} mt-1 w-full`} value={subscriptionForm.start_date} onChange={e=>setSubscriptionForm({...subscriptionForm,start_date:e.target.value})}/></label>
            <label className="text-xs font-bold text-stone-500">Proximo vencimento<input required type="date" className={`${field} mt-1 w-full`} value={subscriptionForm.next_due_date} onChange={e=>setSubscriptionForm({...subscriptionForm,next_due_date:e.target.value})}/></label>
            <label className="text-xs font-bold text-stone-500">Valor contratado<input required type="number" step="0.01" className={`${field} mt-1 w-full`} value={subscriptionForm.agreed_price} onChange={e=>setSubscriptionForm({...subscriptionForm,agreed_price:e.target.value})}/></label>
            <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white">Salvar assinatura</button>
          </form>}>
          <DataTable headers={["Anunciante","Anuncio","Plano","Valor","Vencimento","Status"]}>{subscriptions.map(item=><tr key={item.id} className="border-t text-sm"><td className="p-3 font-bold">{item.advertiser_name}</td><td className="p-3">{item.business_name}</td><td className="p-3">{item.plan_name}</td><td className="p-3">{money(item.agreed_price)}</td><td className="p-3">{item.next_due_date}</td><td className="p-3">{item.status}</td></tr>)}</DataTable>
        </CrudSection>
      )}

      {tab === "invoices" && (
        <CrudSection title="Nova cobranca" icon={<CreditCard className="h-5 w-5"/>}
          form={<form onSubmit={(event)=>void submit(event,()=>saveInvoice(invoiceForm),()=>setInvoiceForm({...invoiceForm,id:0,subscription:0,description:"",amount:"0.00",discount:"0.00",late_fee:"0.00"}))} className="grid gap-3 md:grid-cols-3">
            <select required className={field} value={invoiceForm.subscription} onChange={e=>{const sub=subscriptions.find(s=>s.id===Number(e.target.value));setInvoiceForm({...invoiceForm,subscription:Number(e.target.value),amount:sub?.agreed_price??invoiceForm.amount})}}><option value={0}>Assinatura</option>{subscriptions.map(s=><option key={s.id} value={s.id}>{s.advertiser_name} · {s.business_name}</option>)}</select>
            <input className={field} placeholder="Descricao" value={invoiceForm.description} onChange={e=>setInvoiceForm({...invoiceForm,description:e.target.value})}/>
            <input required type="number" step="0.01" className={field} placeholder="Valor" value={invoiceForm.amount} onChange={e=>setInvoiceForm({...invoiceForm,amount:e.target.value})}/>
            <label className="text-xs font-bold text-stone-500">Competencia<input required type="date" className={`${field} mt-1 w-full`} value={invoiceForm.reference_month} onChange={e=>setInvoiceForm({...invoiceForm,reference_month:e.target.value})}/></label>
            <label className="text-xs font-bold text-stone-500">Vencimento<input required type="date" className={`${field} mt-1 w-full`} value={invoiceForm.due_date} onChange={e=>setInvoiceForm({...invoiceForm,due_date:e.target.value})}/></label>
            <select className={field} value={invoiceForm.status} onChange={e=>setInvoiceForm({...invoiceForm,status:e.target.value as Invoice["status"],paid_at:e.target.value==="paid"?today():null})}><option value="open">Em aberto</option><option value="paid">Paga</option><option value="overdue">Vencida</option><option value="cancelled">Cancelada</option></select>
            <input type="number" step="0.01" className={field} placeholder="Desconto" value={invoiceForm.discount} onChange={e=>setInvoiceForm({...invoiceForm,discount:e.target.value})}/>
            <input type="number" step="0.01" className={field} placeholder="Multa/juros" value={invoiceForm.late_fee} onChange={e=>setInvoiceForm({...invoiceForm,late_fee:e.target.value})}/>
            <select className={field} value={invoiceForm.payment_method} onChange={e=>setInvoiceForm({...invoiceForm,payment_method:e.target.value})}><option value="">Forma de pagamento</option><option value="pix">PIX</option><option value="boleto">Boleto</option><option value="card">Cartao</option><option value="transfer">Transferencia</option><option value="cash">Dinheiro</option><option value="other">Outro</option></select>
            <button className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white">Salvar cobranca</button>
          </form>}>
          <DataTable headers={["Anunciante","Anuncio","Vencimento","Total","Status","Pagamento","Acoes"]}>{invoices.map(item=><tr key={item.id} className="border-t text-sm"><td className="p-3 font-bold">{item.advertiser_name}</td><td className="p-3">{item.business_name}</td><td className="p-3">{item.due_date}</td><td className="p-3 font-bold">{money(item.total)}</td><td className="p-3">{item.status === "open" && item.due_date < today() ? "overdue" : item.status}</td><td className="p-3">{item.payment_method||"-"}</td><td className="p-3">{item.status !== "paid" && item.status !== "cancelled" && <button onClick={()=>void markInvoicePaid(item)} className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-bold text-white">Marcar paga</button>}</td></tr>)}</DataTable>
        </CrudSection>
      )}
    </div>
  );
}

function CrudSection({ title, icon, form, children }: { title:string; icon:ReactNode; form:ReactNode; children:ReactNode }) {
  return <div className="space-y-4"><div className="rounded-lg border border-stone-200 bg-white p-4"><h3 className="mb-4 flex items-center gap-2 font-extrabold">{icon}{title}</h3>{form}</div><div className="overflow-hidden rounded-lg border border-stone-200 bg-white">{children}</div></div>;
}

function DataTable({headers,children}:{headers:string[];children:ReactNode}) {
  return <div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-stone-50 text-xs uppercase text-stone-500"><tr>{headers.map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
