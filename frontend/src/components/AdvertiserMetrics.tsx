import type { AdvertiserPortalData } from "../api";

export function AdvertiserMetrics({ metrics }: { metrics: AdvertiserPortalData["metrics"] }) {
  if (!metrics) return null;
  const businesses = new Map<number, { name: string; views: number; contacts: number; whatsapp: number }>();
  for (const item of metrics.totals) {
    const row = businesses.get(item.business_id) ?? { name: item.business__name, views: 0, contacts: 0, whatsapp: 0 };
    if (item.event === "view") row.views += item.count;
    else row.contacts += item.count;
    if (item.event === "whatsapp") row.whatsapp += item.count;
    businesses.set(item.business_id, row);
  }
  const date = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR");
  return <section className="mt-5 overflow-x-auto border border-slate-300 bg-white p-4">
    <h2 className="font-bold">Visitas e cliques</h2>
    <p className="mt-1 text-xs text-slate-500">Últimos 30 dias: {date(metrics.start)} a {date(metrics.end)}. Contagem de interações, sem identificação dos visitantes.</p>
    {businesses.size ? <table className="mt-4 min-w-full text-left text-sm"><thead><tr className="border-b border-slate-200"><th className="py-2 pr-4">Estabelecimento</th><th className="px-3">Visualizações</th><th className="px-3">Cliques em contatos</th><th className="px-3">WhatsApp</th></tr></thead>
      <tbody>{Array.from(businesses, ([id, row]) => <tr key={id} className="border-b border-slate-100"><td className="py-3 pr-4">{row.name}</td><td className="px-3 tabular-nums">{row.views}</td><td className="px-3 tabular-nums">{row.contacts}</td><td className="px-3 tabular-nums">{row.whatsapp}</td></tr>)}</tbody></table>
      : <p className="mt-4 text-sm text-slate-500">Ainda não há interações registradas neste período.</p>}
  </section>;
}
