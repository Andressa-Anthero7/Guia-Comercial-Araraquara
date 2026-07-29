import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Building2, CirclePause, FilePlus2, Megaphone, PlusCircle, RefreshCw,
  Search, Store, UserRound
} from "lucide-react";
import {
  Advertiser, Advertisement, loadAdvertisements, loadFinanceData,
  saveAdvertisement, saveAdvertiser
} from "../api";
import { Business } from "../types";

type Section = "advertisers" | "businesses" | "advertisements";

interface Props {
  businesses: Business[];
  onNewAdvertiser: () => void;
  onNewBusiness: (advertiserId: number) => void;
  onNewAdvertisement: (business: Business, advertiserId: number) => void;
  onEditAdvertisement: (advertisement: Advertisement, business: Business, advertiserId: number) => void;
  onEditBusiness: (business: Business) => void;
}

const advertiserStatus: Record<Advertiser["status"], string> = {
  active: "Ativo", inactive: "Inativo", prospect: "Prospect"
};
const adStatus: Record<Advertisement["status"], string> = {
  draft: "Rascunho", review: "Pendente", published: "Ativo",
  paused: "Suspenso", ended: "Inativo"
};
const businessStatus: Record<string, string> = {
  active: "Ativo", pending: "Pendente", draft: "Rascunho", inactive: "Inativo"
};

export function CommercialManagement({
  businesses, onNewAdvertiser, onNewBusiness, onNewAdvertisement, onEditAdvertisement, onEditBusiness
}: Props) {
  const [section, setSection] = useState<Section>("advertisers");
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = async () => {
    setLoading(true);
    setError("");
    try {
      const [finance, ads] = await Promise.all([loadFinanceData(), loadAdvertisements()]);
      setAdvertisers(finance.advertisers);
      setAdvertisements(ads);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel carregar a central comercial.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), 30000);
    const focus = () => void reload();
    window.addEventListener("focus", focus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
  }, []);

  const ownerFor = (businessId: string | number) =>
    advertisers.find(item => item.businesses.includes(Number(businessId)));

  const filteredAdvertisers = useMemo(() => advertisers.filter(item => {
    const matches = `${item.name} ${item.contact_name} ${item.document} ${item.email}`.toLowerCase().includes(query.toLowerCase());
    return matches && (status === "all" || item.status === status);
  }), [advertisers, query, status]);
  const filteredBusinesses = useMemo(() => businesses.filter(item => {
    const matches = `${item.name} ${item.category} ${item.neighborhood}`.toLowerCase().includes(query.toLowerCase());
    return matches && (status === "all" || (item.status ?? "active") === status);
  }), [businesses, query, status]);
  const filteredAds = useMemo(() => advertisements.filter(item => {
    const matches = `${item.title} ${item.business_name} ${item.short_description}`.toLowerCase().includes(query.toLowerCase());
    return matches && (status === "all" || item.status === status);
  }), [advertisements, query, status]);

  const changeAdvertiserStatus = async (item: Advertiser, next: Advertiser["status"]) => {
    try {
      await saveAdvertiser({ ...item, status: next });
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel atualizar o anunciante.");
    }
  };
  const changeAdStatus = async (item: Advertisement, next: Advertisement["status"]) => {
    try {
      await saveAdvertisement({ ...item, tags: item.tag_names, status: next });
      await reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel atualizar o anuncio.");
    }
  };

  const statusOptions =
    section === "advertisers"
      ? [["active","Ativos"],["prospect","Prospects"],["inactive","Inativos"]]
      : section === "businesses"
        ? [["active","Ativos"],["pending","Pendentes"],["draft","Rascunhos"],["inactive","Inativos"]]
        : [["published","Ativos"],["review","Pendentes"],["draft","Rascunhos"],["paused","Suspensos"],["ended","Inativos"]];

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-stone-200 bg-white p-3 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold">Central comercial</h2>
            <p className="text-sm text-stone-500">Gestao completa da carteira, unidades comerciais e campanhas.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>void reload()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold"><RefreshCw className={`h-4 w-4 ${loading?"animate-spin":""}`}/>Atualizar</button>
            <button onClick={onNewAdvertiser} className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-2 text-sm font-bold text-white"><PlusCircle className="h-4 w-4"/>Novo cadastro</button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Summary label="Anunciantes" value={advertisers.length} icon={<UserRound className="h-5 w-5"/>}/>
          <Summary label="Estabelecimentos" value={businesses.length} icon={<Store className="h-5 w-5"/>}/>
          <Summary label="Anuncios" value={advertisements.length} icon={<Megaphone className="h-5 w-5"/>}/>
        </div>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}

      <div className="rounded-lg border border-stone-200 bg-white">
        <div className="flex gap-2 overflow-x-auto border-b p-2">
          {([
            ["advertisers","Anunciantes",UserRound],["businesses","Estabelecimentos",Building2],["advertisements","Anuncios",Megaphone]
          ] as const).map(([value,label,Icon])=><button key={value} onClick={()=>{setSection(value);setStatus("all")}} className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold ${section===value?"bg-stone-900 text-white":"text-stone-600 hover:bg-stone-50"}`}><Icon className="h-4 w-4"/>{label}</button>)}
        </div>
        <div className="flex flex-col gap-2 border-b p-4 sm:flex-row">
          <label className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-stone-400"/><input value={query} onChange={e=>setQuery(e.target.value)} className="h-10 w-full rounded-lg border border-stone-200 pl-9 pr-3 text-sm" placeholder="Buscar por nome, contato, categoria ou bairro"/></label>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="h-10 rounded-lg border border-stone-200 px-3 text-sm font-bold"><option value="all">Todos os status</option>{statusOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        </div>

        {section === "advertisers" && <div className="divide-y">
          {filteredAdvertisers.map(item=><div key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center">
            <div><div className="font-extrabold">{item.name}</div><div className="text-xs text-stone-500">{item.document || "Documento nao informado"} · {item.contact_name}</div></div>
            <div className="text-sm">{item.phone}<div className="text-xs text-stone-500">{item.email}</div></div>
            <div className="text-sm"><b>{item.businesses.length}</b> estabelecimento(s)<div className="text-xs text-stone-500">{advertiserStatus[item.status]}</div></div>
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={()=>onNewBusiness(item.id)} className="rounded-md bg-amber-400 px-3 py-2 text-xs font-bold">+ Estabelecimento</button>
              {item.status==="active"?<button onClick={()=>void changeAdvertiserStatus(item,"inactive")} className="rounded-md border px-3 py-2 text-xs font-bold">Inativar</button>:<button onClick={()=>void changeAdvertiserStatus(item,"active")} className="rounded-md border px-3 py-2 text-xs font-bold">Ativar</button>}
            </div>
          </div>)}
        </div>}

        {section === "businesses" && <div className="divide-y">
          {filteredBusinesses.map(item=>{const owner=ownerFor(item.id);return <div key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center">
            <div><div className="font-extrabold">{item.name}</div><div className="text-xs text-stone-500">{item.category} · {item.neighborhood}</div></div>
            <div className="text-sm">{owner?.name || "Sem anunciante vinculado"}<div className="text-xs text-stone-500">{item.phone}</div></div>
            <div className="text-sm">{businessStatus[item.status??"active"]}<div className="text-xs text-stone-500">{advertisements.filter(ad=>ad.business===Number(item.id)).length} anuncio(s)</div></div>
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={()=>onNewAdvertisement(item,owner?.id??0)} className="rounded-md bg-amber-400 px-3 py-2 text-xs font-bold">+ Anuncio</button>
              <button onClick={()=>onEditBusiness(item)} className="rounded-md border px-3 py-2 text-xs font-bold">Editar perfil</button>
            </div>
          </div>})}
        </div>}

        {section === "advertisements" && <div className="divide-y">
          {filteredAds.map(item=><div key={item.id} className="grid gap-3 p-4 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-center">
            <div><div className="flex items-center gap-2 font-extrabold">{item.title}{item.is_primary&&<span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">Principal</span>}</div><div className="text-xs text-stone-500">{item.business_name} · {item.short_description}</div></div>
            <div className="text-sm">{adStatus[item.status]}<div className="text-xs text-stone-500">{item.starts_at||"Sem inicio"} → {item.ends_at||"Continuo"}</div></div>
            <div className="text-sm">{item.is_featured?"Destaque":"Padrao"}<div className="text-xs text-stone-500">{item.media.length} midia(s)</div></div>
            <div className="flex flex-wrap justify-end gap-2">
              <button onClick={()=>{const business=businesses.find(value=>Number(value.id)===item.business);if(business)onEditAdvertisement(item,business,ownerFor(item.business)?.id??0)}} className="rounded-md border px-3 py-2 text-xs font-bold">Editar</button>
              {item.status!=="published"&&<button onClick={()=>void changeAdStatus(item,"published")} className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white">Publicar</button>}
              {item.status==="published"&&<button onClick={()=>void changeAdStatus(item,"paused")} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs font-bold"><CirclePause className="h-3 w-3"/>Suspender</button>}
              {(item.status==="paused"||item.status==="ended")&&<button onClick={()=>void changeAdStatus(item,"published")} className="rounded-md border px-3 py-2 text-xs font-bold">Reativar</button>}
            </div>
          </div>)}
        </div>}
        {!loading && ((section==="advertisers"&&!filteredAdvertisers.length)||(section==="businesses"&&!filteredBusinesses.length)||(section==="advertisements"&&!filteredAds.length))&&<div className="p-10 text-center text-sm text-stone-500"><FilePlus2 className="mx-auto mb-2 h-8 w-8"/>Nenhum registro encontrado.</div>}
      </div>
    </div>
  );
}

function Summary({label,value,icon}:{label:string;value:number;icon:ReactNode}) {
  return <div className="flex items-center justify-between rounded-lg bg-stone-50 p-4"><div><div className="text-xs font-bold uppercase text-stone-500">{label}</div><div className="text-2xl font-extrabold">{value}</div></div><div className="text-amber-500">{icon}</div></div>;
}
