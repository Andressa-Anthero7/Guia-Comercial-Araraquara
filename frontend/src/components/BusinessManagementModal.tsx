import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Building2, Clock3, Edit3, ExternalLink, Globe2, Link2,
  MapPin, Megaphone, Phone, Share2, Trash2, X
} from "lucide-react";
import { Advertisement, loadAdvertisements } from "../api";
import { Business } from "../types";

type BusinessStatus = NonNullable<Business["status"]>;

interface Props {
  business: Business;
  onClose: () => void;
  onEdit: (business: Business) => void;
  onDelete: (business: Business) => Promise<void>;
  onStatusChange: (business: Business, status: BusinessStatus) => Promise<void>;
}

const PUBLIC_PORTAL_ORIGIN = "https://www.guiacomararaquara.com.br";
const PUBLIC_DOMAIN = "guiacomararaquara.com.br";
const statusOptions: Array<{ value: BusinessStatus; label: string }> = [
  { value: "active", label: "Ativo / publicado" },
  { value: "pending", label: "Pendente" },
  { value: "draft", label: "Rascunho" },
  { value: "suspended", label: "Suspenso" },
  { value: "inactive", label: "Inativo" }
];
const adStatus: Record<Advertisement["status"], string> = {
  draft: "Rascunho", review: "Em revisão", published: "Publicado",
  paused: "Pausado", ended: "Encerrado"
};

function publicUrl(business: Business) {
  if (business.publicSubdomain) {
    return `https://${business.publicSubdomain}.${PUBLIC_DOMAIN}`;
  }
  return `${PUBLIC_PORTAL_ORIGIN}/?empresa=${encodeURIComponent(business.slug ?? business.id)}`;
}

export function BusinessManagementModal({ business, onClose, onEdit, onDelete, onStatusChange }: Props) {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = business.status ?? "active";
  const businessAds = useMemo(
    () => advertisements.filter((advertisement) => String(advertisement.business) === business.id),
    [advertisements, business.id]
  );

  useEffect(() => {
    setLoadingAds(true);
    loadAdvertisements()
      .then(setAdvertisements)
      .catch(() => setAdvertisements([]))
      .finally(() => setLoadingAds(false));
  }, [business.id]);

  useEffect(() => {
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeWithEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [onClose]);

  const changeStatus = async (nextStatus: BusinessStatus) => {
    if (nextStatus === status) return;
    if (
      (nextStatus === "suspended" || nextStatus === "inactive") &&
      !window.confirm("O estabelecimento deixará de aparecer no guia público. Confirmar?")
    ) return;
    setChangingStatus(true);
    try {
      await onStatusChange(business, nextStatus);
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "Não foi possível alterar o status.");
    } finally {
      setChangingStatus(false);
    }
  };

  const share = (network: "whatsapp" | "facebook" | "linkedin") => {
    const url = encodeURIComponent(publicUrl(business));
    const text = encodeURIComponent(`Confira ${business.name} no Guia Comercial Araraquara`);
    const targets = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    };
    window.open(targets[network], "_blank", "noopener,noreferrer,width=720,height=640");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(publicUrl(business));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={`Gestão de ${business.name}`}>
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Fechar modal" />
      <div className="relative flex max-h-[96dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-stone-100 shadow-2xl sm:max-h-[92vh] sm:rounded-2xl">
        <header className="flex items-start gap-3 border-b border-stone-200 bg-white p-3 sm:p-5">
          <img src={business.logoImage || business.image} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-stone-200 bg-stone-50 object-contain sm:h-16 sm:w-16" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Gestão do estabelecimento</div>
            <h2 className="truncate text-lg font-extrabold text-stone-950 sm:text-2xl">{business.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{business.neighborhood}</span>
              <span>#{business.id}</span>
            </div>
          </div>
          <button onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50" aria-label="Fechar"><X className="h-5 w-5" /></button>
        </header>

        <div className="overflow-y-auto p-3 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-4">
              <section className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <label className="text-xs font-bold uppercase tracking-wide text-stone-500">
                    Status de publicação
                    <select value={status} disabled={changingStatus} onChange={(event) => void changeStatus(event.target.value as BusinessStatus)} className="mt-1 block h-10 min-w-56 rounded-lg border border-stone-300 bg-white px-3 text-sm font-bold text-stone-800 disabled:opacity-60">
                      {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                  <button onClick={() => onEdit(business)} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 text-sm font-bold text-white"><Edit3 className="h-4 w-4" />Editar dados</button>
                </div>
              </section>

              <section className="rounded-xl border border-stone-200 bg-white p-4">
                <h3 className="flex items-center gap-2 font-extrabold text-stone-950"><Building2 className="h-5 w-5 text-amber-500" />Dados do estabelecimento</h3>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <Info label="Endereço" value={`${business.address} · ${business.neighborhood}, ${business.city ?? "Araraquara"}/${business.state ?? "SP"}`} />
                  <Info label="Contato" value={business.phone} icon={<Phone className="h-4 w-4" />} />
                  <Info label="E-mail" value={business.email || "Não informado"} />
                  <Info label="Horário" value={business.hours || "Não informado"} icon={<Clock3 className="h-4 w-4" />} />
                  <Info label="Site" value={business.website || "Não informado"} />
                  <Info label="Instagram" value={business.instagram ? `@${business.instagram.replace("@", "")}` : "Não informado"} />
                </div>
                <div className="mt-4 border-t border-stone-100 pt-4">
                  <div className="text-xs font-bold uppercase text-stone-500">Descrição</div>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-700">{business.description || "Sem descrição."}</p>
                  {!!business.tags.length && <div className="mt-3 flex flex-wrap gap-1.5">{business.tags.map((tag) => <span key={tag} className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-600">#{tag}</span>)}</div>}
                </div>
              </section>

              <section className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-extrabold text-stone-950"><Megaphone className="h-5 w-5 text-amber-500" />Anúncios vinculados</h3>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold">{businessAds.length}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {businessAds.map((advertisement) => (
                    <article key={advertisement.id} className="flex gap-3 rounded-lg border border-stone-200 p-3">
                      <img src={advertisement.cover_image || business.image} alt="" className="h-14 w-14 shrink-0 rounded-lg bg-stone-100 object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <b className="truncate text-sm text-stone-900">{advertisement.title}</b>
                          <span className="rounded-md bg-stone-100 px-2 py-1 text-[10px] font-bold uppercase text-stone-600">{adStatus[advertisement.status]}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-stone-500">{advertisement.short_description || advertisement.description}</p>
                        <div className="mt-1 text-[10px] font-semibold text-stone-400">{advertisement.is_primary ? "Anúncio principal" : "Campanha adicional"} · {advertisement.media.length} mídia(s)</div>
                      </div>
                    </article>
                  ))}
                  {loadingAds && <div className="py-6 text-center text-sm text-stone-500">Carregando anúncios...</div>}
                  {!loadingAds && !businessAds.length && <div className="rounded-lg border border-dashed border-stone-300 py-6 text-center text-sm text-stone-500">Nenhum anúncio vinculado.</div>}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-xl border border-stone-200 bg-white p-4">
                <h3 className="flex items-center gap-2 font-extrabold"><Globe2 className="h-5 w-5 text-blue-600" />Página pública</h3>
                {status === "active" ? (
                  <>
                    <div className="mt-3 break-all rounded-lg bg-stone-50 p-3 text-xs text-stone-600">{publicUrl(business)}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a href={publicUrl(business)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-bold text-white"><ExternalLink className="h-4 w-4" />Conferir</a>
                      <button onClick={() => void copyLink()} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-stone-300 text-xs font-bold text-stone-700"><Link2 className="h-4 w-4" />{copied ? "Copiado" : "Copiar link"}</button>
                    </div>
                  </>
                ) : <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">Publique o estabelecimento para liberar a página e o compartilhamento.</p>}
              </section>

              {status === "active" && (
                <section className="rounded-xl border border-stone-200 bg-white p-4">
                  <h3 className="flex items-center gap-2 font-extrabold"><Share2 className="h-5 w-5 text-violet-600" />Compartilhar</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                    <ShareButton label="WhatsApp" onClick={() => share("whatsapp")} className="border-emerald-200 text-emerald-700" />
                    <ShareButton label="Facebook" onClick={() => share("facebook")} className="border-blue-200 text-blue-700" />
                    <ShareButton label="LinkedIn" onClick={() => share("linkedin")} className="border-sky-200 text-sky-700" />
                  </div>
                </section>
              )}

              <section className="rounded-xl border border-rose-200 bg-white p-4">
                <h3 className="font-extrabold text-rose-800">Área administrativa</h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-500">A exclusão remove o estabelecimento e seus vínculos. Prefira suspender ou inativar quando houver histórico comercial.</p>
                <button onClick={() => void onDelete(business)} className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-rose-300 text-xs font-bold text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" />Excluir estabelecimento</button>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div className="rounded-lg bg-stone-50 p-3"><div className="text-[10px] font-bold uppercase text-stone-500">{label}</div><div className="mt-1 flex items-start gap-2 font-semibold text-stone-800">{icon}{value}</div></div>;
}

function ShareButton({ label, onClick, className }: { label: string; onClick: () => void; className: string }) {
  return <button onClick={onClick} className={`h-10 rounded-lg border bg-white text-xs font-bold hover:bg-stone-50 ${className}`}>{label}</button>;
}
