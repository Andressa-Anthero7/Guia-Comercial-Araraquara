import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, ImagePlus, UserRound } from "lucide-react";
import {
  Advertiser, Advertisement, AdvertisingPlan, loadFinanceData, saveAdvertisement,
  saveAdvertiser, saveAdvertisingSubscription, saveBackofficeBusiness
} from "../api";
import { NEIGHBORHOODS } from "../data";
import { useCategories } from "../categories";
import { Business } from "../types";
import { optimizeImageFile, parseTags } from "../utils/content";

interface Props {
  onCancel: () => void;
  onComplete: (business: Business) => void;
  initialAdvertiserId?: number;
  existingBusiness?: Business | null;
  existingAdvertisement?: Advertisement | null;
}

const now = () => new Date().toISOString().slice(0, 10);
const inputClass = "h-10 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100";

export function AdvertiserOnboarding({ onCancel, onComplete, initialAdvertiserId = 0, existingBusiness = null, existingAdvertisement = null }: Props) {
  const CATEGORIES = useCategories();
  const [step, setStep] = useState(
    existingBusiness && initialAdvertiserId ? 3 : initialAdvertiserId ? 2 : 1
  );
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [plans, setPlans] = useState<AdvertisingPlan[]>([]);
  const [existingAdvertiserId, setExistingAdvertiserId] = useState(initialAdvertiserId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [advertiser, setAdvertiser] = useState<Advertiser>({
    id: 0, user: null, businesses: [], business_names: [], name: "", document: "",
    contact_name: "", email: "", phone: "", billing_email: "", status: "active", notes: ""
  });
  const [establishment, setEstablishment] = useState({
    name: existingBusiness?.name ?? "", category: existingBusiness?.category ?? CATEGORIES[0]?.slug ?? "",
    street: existingBusiness?.street ?? "", number: existingBusiness?.number ?? "",
    complement: existingBusiness?.complement ?? "", neighborhood: existingBusiness?.neighborhood ?? NEIGHBORHOODS[0] ?? "",
    city: existingBusiness?.city ?? "Araraquara", state: existingBusiness?.state ?? "SP",
    postalCode: existingBusiness?.postalCode ?? "", phone: existingBusiness?.phone ?? "",
    whatsapp: existingBusiness?.whatsapp ?? "",
    email: existingBusiness?.email ?? "", website: existingBusiness?.website ?? "",
    instagram: existingBusiness?.instagram ?? "", hours: existingBusiness?.hours ?? "Seg - Sab: 08:00 as 18:00"
  });
  const [ad, setAd] = useState({
    title: existingAdvertisement?.title ?? (existingBusiness ? `${existingBusiness.name} - nova campanha` : ""),
    shortDescription: existingAdvertisement?.short_description ?? "",
    description: existingAdvertisement?.description ?? "",
    callToAction: existingAdvertisement?.call_to_action ?? "Saiba mais",
    destinationUrl: existingAdvertisement?.destination_url ?? "",
    logoImage: existingAdvertisement?.logo_image ?? "",
    coverImage: existingAdvertisement?.cover_image ?? "",
    videoUrl: existingAdvertisement?.video_url ?? "",
    tags: existingAdvertisement?.tag_names.join(", ") ?? "",
    photos: existingAdvertisement?.media.filter(item => item.media_type === "image").map(item => item.file_data) ?? [],
    startsAt: existingAdvertisement?.starts_at ?? now(),
    endsAt: existingAdvertisement?.ends_at ?? "",
    status: existingAdvertisement?.status ?? "review" as Advertisement["status"],
    featured: existingAdvertisement?.is_featured ?? false
  });
  const [commercial, setCommercial] = useState({
    planId: 0, price: "0.00", nextDueDate: now(), autoRenew: true, notes: ""
  });
  const [marketing, setMarketing] = useState({ subdomain: existingBusiness?.publicSubdomain ?? "", metaPixelId: existingBusiness?.metaPixelId ?? "", googleAnalyticsId: existingBusiness?.googleAnalyticsId ?? "", googleAdsId: existingBusiness?.googleAdsId ?? "" });
  const selectedPlan = plans.find((plan) => plan.id === commercial.planId);
  useEffect(() => {
    if (!existingBusiness && !CATEGORIES.some(item => item.slug === establishment.category)) {
      setEstablishment(previous => ({ ...previous, category: CATEGORIES[0]?.slug || "" }));
    }
  }, [CATEGORIES, existingBusiness, establishment.category]);
  const isPaidPlan = existingBusiness?.planType === "paid" || selectedPlan?.plan_type === "paid";
  const allowsCustomPage = isPaidPlan && (selectedPlan?.includes_custom_page ?? true);
  const maxImages = isPaidPlan ? Math.min(selectedPlan?.max_images ?? 5, 5) : 1;

  useEffect(() => {
    loadFinanceData()
      .then(data => {
        setAdvertisers(data.advertisers);
        setPlans(data.plans);
      })
      .catch(() => undefined);
  }, []);

  const next = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setStep(current => existingBusiness && current === 1 ? 3 : Math.min(4, current + 1));
  };

  const addPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from<File>(event.target.files ?? []).slice(0, maxImages - ad.photos.length);
    try {
      const photos: string[] = [];
      for (const file of files) photos.push(await optimizeImageFile(file));
      setAd(current => ({
        ...current,
        photos: [...current.photos, ...photos].slice(0, maxImages),
        coverImage: current.coverImage || photos[0] || ""
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel carregar as fotos.");
    }
    event.target.value = "";
  };

  const selectPlan = (planId: number) => {
    const plan = plans.find((item) => item.id === planId);
    const paid = existingBusiness?.planType === "paid" || plan?.plan_type === "paid";
    const imageLimit = paid ? Math.min(plan?.max_images ?? 5, 5) : 1;
    setCommercial((current) => ({ ...current, planId, price: plan?.price ?? "0.00" }));
    setAd((current) => ({
      ...current,
      featured: paid ? current.featured : false,
      photos: current.photos.slice(0, imageLimit),
      coverImage: current.photos.slice(0, imageLimit)[0] || current.coverImage,
    }));
    if (!paid || plan?.includes_custom_page === false) {
      setMarketing((current) => ({ ...current, subdomain: "", metaPixelId: "", googleAnalyticsId: "", googleAdsId: "" }));
    }
  };

  const finish = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      let owner = advertisers.find(item => item.id === existingAdvertiserId);
      if (!owner) owner = await saveAdvertiser(advertiser);

      const businessDraft: Business = {
        ...(existingBusiness ?? { id: `new-${Date.now()}` }),
        name: establishment.name.trim(),
        description: ad.description.trim(),
        servicesProducts: ad.description.trim(),
        planType: isPaidPlan ? "paid" : "free",
        publicSubdomain: allowsCustomPage ? marketing.subdomain.trim().toLowerCase() : "",
        metaPixelId: allowsCustomPage ? marketing.metaPixelId.trim() : "",
        googleAnalyticsId: allowsCustomPage ? marketing.googleAnalyticsId.trim() : "",
        googleAdsId: allowsCustomPage ? marketing.googleAdsId.trim() : "",
        category: establishment.category,
        address: `${establishment.street}, ${establishment.number}`,
        street: establishment.street,
        number: establishment.number,
        complement: establishment.complement,
        neighborhood: establishment.neighborhood,
        city: establishment.city,
        state: establishment.state,
        postalCode: establishment.postalCode,
        phone: establishment.phone,
        whatsapp: establishment.whatsapp,
        email: establishment.email,
        website: establishment.website,
        instagram: establishment.instagram.replace("@", ""),
        rating: 0,
        reviewsCount: 0,
        image: ad.coverImage,
        logoImage: ad.logoImage,
        images: ad.photos,
        isFeatured: ad.featured,
        status: ad.status === "published" ? "active" : "pending",
        hours: establishment.hours,
        tags: parseTags(ad.tags)
      };
      const business = await saveBackofficeBusiness(businessDraft);

      if (!owner.businesses.includes(Number(business.id))) {
        owner = await saveAdvertiser({
          ...owner,
          businesses: Array.from(new Set([...owner.businesses, Number(business.id)]))
        });
      }

      const advertisement = await saveAdvertisement({
        id: existingAdvertisement?.id ?? 0,
        business: Number(business.id),
        business_name: business.name,
        title: ad.title || business.name,
        short_description: ad.shortDescription,
        description: ad.description,
        call_to_action: ad.callToAction,
        destination_url: ad.destinationUrl,
        logo_image: ad.logoImage,
        cover_image: ad.coverImage,
        video_url: ad.videoUrl,
        tags: parseTags(ad.tags),
        tag_names: [],
        media: ad.photos.map((photo, index) => ({
          media_type: "image", file_data: photo, alt_text: business.name, caption: "", order: index
        })),
        starts_at: ad.startsAt || null,
        ends_at: ad.endsAt || null,
        status: ad.status,
        is_featured: ad.featured,
        is_primary: existingAdvertisement?.is_primary ?? !existingBusiness
      });

      if (commercial.planId) {
        await saveAdvertisingSubscription({
          id: 0,
          advertiser: owner.id,
          advertiser_name: owner.name,
          business: Number(business.id),
          business_name: business.name,
          advertisement: advertisement.id,
          plan: commercial.planId,
          plan_name: plans.find(plan => plan.id === commercial.planId)?.name ?? "",
          start_date: ad.startsAt || now(),
          end_date: ad.endsAt || null,
          next_due_date: commercial.nextDueDate,
          agreed_price: commercial.price,
          status: "active",
          auto_renew: commercial.autoRenew,
          notes: commercial.notes
        });
      }
      onComplete(business);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nao foi possivel concluir o cadastro.");
    } finally {
      setSaving(false);
    }
  };

  const steps = ["Anunciante", "Estabelecimento", "Conteudo do anuncio", "Plano e revisao"];
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-stone-200 bg-white p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold">
              {existingAdvertisement ? "Editar anuncio" : existingBusiness ? "Novo anuncio para estabelecimento existente" : initialAdvertiserId ? "Novo estabelecimento para anunciante" : "Novo anunciante e anuncio"}
            </h2>
            <p className="text-sm text-stone-500">O perfil comercial continua sendo a base permanente do guia.</p>
          </div>
          <button onClick={onCancel} className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-bold">Cancelar</button>
        </div>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0">
          {steps.map((label, index) => (
            <div key={label} className={`min-w-max shrink-0 rounded-md px-3 py-2 text-xs font-bold sm:min-w-0 ${step === index + 1 ? "bg-stone-900 text-white" : step > index + 1 ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
              {index + 1}. {label}
            </div>
          ))}
        </div>
      </div>
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div>}

      {step === 1 && <form onSubmit={next} className="rounded-lg border border-stone-200 bg-white p-3 sm:p-5">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-extrabold"><UserRound className="h-5 w-5 text-amber-500"/>Dados comerciais do anunciante</h3>
        <p className="mb-4 text-sm text-stone-500">Um anunciante pode ser responsavel por varios estabelecimentos.</p>
        {!!advertisers.length && <select className={`${inputClass} mb-4 w-full`} value={existingAdvertiserId} onChange={e=>setExistingAdvertiserId(Number(e.target.value))}><option value={0}>Criar novo anunciante</option>{advertisers.map(item=><option key={item.id} value={item.id}>{item.name} · {item.document}</option>)}</select>}
        {!existingAdvertiserId && <div className="grid gap-3 md:grid-cols-2">
          <input required className={inputClass} placeholder="Nome ou razao social" value={advertiser.name} onChange={e=>setAdvertiser({...advertiser,name:e.target.value})}/>
          <input className={inputClass} placeholder="CPF/CNPJ" value={advertiser.document} onChange={e=>setAdvertiser({...advertiser,document:e.target.value})}/>
          <input required className={inputClass} placeholder="Responsavel" value={advertiser.contact_name} onChange={e=>setAdvertiser({...advertiser,contact_name:e.target.value})}/>
          <input required className={inputClass} placeholder="Telefone/WhatsApp" value={advertiser.phone} onChange={e=>setAdvertiser({...advertiser,phone:e.target.value})}/>
          <input type="email" className={inputClass} placeholder="E-mail comercial" value={advertiser.email} onChange={e=>setAdvertiser({...advertiser,email:e.target.value})}/>
          <input type="email" className={inputClass} placeholder="E-mail financeiro" value={advertiser.billing_email} onChange={e=>setAdvertiser({...advertiser,billing_email:e.target.value})}/>
        </div>}
        <NextButton/>
      </form>}

      {step === 2 && <form onSubmit={next} className="rounded-lg border border-stone-200 bg-white p-3 sm:p-5">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-extrabold"><Building2 className="h-5 w-5 text-amber-500"/>Perfil do estabelecimento</h3>
        <p className="mb-4 text-sm text-stone-500">Informacoes permanentes usadas na busca e no perfil do guia comercial.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <input required className={inputClass} placeholder="Nome fantasia" value={establishment.name} onChange={e=>{setEstablishment({...establishment,name:e.target.value});if(!ad.title)setAd({...ad,title:e.target.value})}}/>
          <select required className={inputClass} value={establishment.category} onChange={e=>setEstablishment({...establishment,category:e.target.value})}>{CATEGORIES.map(item=><option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
          <input required className={inputClass} placeholder="Rua" value={establishment.street} onChange={e=>setEstablishment({...establishment,street:e.target.value})}/>
          <input required className={inputClass} placeholder="Numero" value={establishment.number} onChange={e=>setEstablishment({...establishment,number:e.target.value})}/>
          <input className={inputClass} placeholder="Complemento" value={establishment.complement} onChange={e=>setEstablishment({...establishment,complement:e.target.value})}/>
          <select className={inputClass} value={establishment.neighborhood} onChange={e=>setEstablishment({...establishment,neighborhood:e.target.value})}>{NEIGHBORHOODS.map(item=><option key={item}>{item}</option>)}</select>
          <input className={inputClass} placeholder="Telefone comercial" value={establishment.phone} onChange={e=>setEstablishment({...establishment,phone:e.target.value})}/>
          <input required className={inputClass} placeholder="WhatsApp do estabelecimento" value={establishment.whatsapp} onChange={e=>setEstablishment({...establishment,whatsapp:e.target.value})}/>
          <input type="email" className={inputClass} placeholder="E-mail publico" value={establishment.email} onChange={e=>setEstablishment({...establishment,email:e.target.value})}/>
          <input className={inputClass} placeholder="Site" value={establishment.website} onChange={e=>setEstablishment({...establishment,website:e.target.value})}/>
          <input className={inputClass} placeholder="Instagram" value={establishment.instagram} onChange={e=>setEstablishment({...establishment,instagram:e.target.value})}/>
          <input className={`${inputClass} md:col-span-2`} placeholder="Horario de funcionamento" value={establishment.hours} onChange={e=>setEstablishment({...establishment,hours:e.target.value})}/>
        </div>
        <WizardNavigation back={()=>setStep(1)}/>
      </form>}

      {step === 3 && <form onSubmit={next} className="rounded-lg border border-stone-200 bg-white p-3 sm:p-5">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-extrabold"><ImagePlus className="h-5 w-5 text-amber-500"/>Conteudo do anuncio</h3>
        <p className="mb-4 text-sm text-stone-500">Fotos, textos e campanha promocional, separados dos dados do estabelecimento.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-bold text-stone-500 md:col-span-2">Plano do anuncio
            <select className={`${inputClass} mt-1 w-full`} value={commercial.planId} onChange={e=>selectPlan(Number(e.target.value))}>
              <option value={0}>Cadastro gratuito - 1 imagem</option>
              {plans.filter(item => item.is_active).map(item=><option key={item.id} value={item.id}>{item.name} - R$ {item.price}</option>)}
            </select>
          </label>
          <input required className={inputClass} placeholder="Titulo do anuncio" value={ad.title} onChange={e=>setAd({...ad,title:e.target.value})}/>
          <input className={inputClass} placeholder="Chamada curta" value={ad.shortDescription} onChange={e=>setAd({...ad,shortDescription:e.target.value})}/>
          <textarea required className="min-h-32 rounded-lg border border-stone-200 p-3 text-sm md:col-span-2" placeholder="Descricao completa" value={ad.description} onChange={e=>setAd({...ad,description:e.target.value})}/>
          <input className={inputClass} placeholder="Botao de acao (ex.: Pedir agora)" value={ad.callToAction} onChange={e=>setAd({...ad,callToAction:e.target.value})}/>
          <input className={inputClass} placeholder="Link do botao" value={ad.destinationUrl} onChange={e=>setAd({...ad,destinationUrl:e.target.value})}/>
          <input className={inputClass} placeholder="URL do video (YouTube/Instagram)" value={ad.videoUrl} onChange={e=>setAd({...ad,videoUrl:e.target.value})}/>
          <input className={inputClass} placeholder="Tags separadas por virgula" value={ad.tags} onChange={e=>setAd({...ad,tags:e.target.value})}/>
          <label className="rounded-lg border-2 border-dashed border-stone-200 p-4 text-center text-sm font-bold md:col-span-2">Adicionar fotos ({isPaidPlan ? `ate ${maxImages} no plano pago` : "1 capa no plano gratuito"})<input type="file" accept="image/*" multiple={isPaidPlan} className="mt-2 block w-full text-xs" onChange={e=>void addPhotos(e)}/></label>
          {!!ad.photos.length && <div className="flex flex-wrap gap-2 md:col-span-2">{ad.photos.map((photo,index)=><img key={index} src={photo} className="h-20 w-20 rounded-md object-cover"/>)}</div>}
        </div>
        <WizardNavigation back={()=>existingBusiness ? (initialAdvertiserId ? onCancel() : setStep(1)) : setStep(2)}/>
      </form>}

      {step === 4 && <form onSubmit={finish} className="rounded-lg border border-stone-200 bg-white p-3 sm:p-5">
        <h3 className="mb-1 flex items-center gap-2 text-lg font-extrabold"><CheckCircle2 className="h-5 w-5 text-emerald-500"/>Plano, publicacao e revisao</h3>
        <p className="mb-4 text-sm text-stone-500">Finalize o vinculo comercial e a vigencia do anuncio.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <select className={inputClass} value={commercial.planId} onChange={e=>{const plan=plans.find(item=>item.id===Number(e.target.value));setCommercial({...commercial,planId:Number(e.target.value),price:plan?.price??"0.00"})}}><option value={0}>Sem plano por enquanto</option>{plans.map(item=><option key={item.id} value={item.id}>{item.name} · R$ {item.price}</option>)}</select>
          <input type="number" step="0.01" className={inputClass} placeholder="Valor negociado" value={commercial.price} onChange={e=>setCommercial({...commercial,price:e.target.value})}/>
          <label className="text-xs font-bold text-stone-500">Inicio da publicacao<input type="date" className={`${inputClass} mt-1 w-full`} value={ad.startsAt} onChange={e=>setAd({...ad,startsAt:e.target.value})}/></label>
          <label className="text-xs font-bold text-stone-500">Fim da publicacao<input type="date" className={`${inputClass} mt-1 w-full`} value={ad.endsAt} onChange={e=>setAd({...ad,endsAt:e.target.value})}/></label>
          <label className="text-xs font-bold text-stone-500">Proximo vencimento<input type="date" className={`${inputClass} mt-1 w-full`} value={commercial.nextDueDate} onChange={e=>setCommercial({...commercial,nextDueDate:e.target.value})}/></label>
          <select className={inputClass} value={ad.status} onChange={e=>setAd({...ad,status:e.target.value as Advertisement["status"]})}><option value="draft">Salvar como rascunho</option><option value="review">Enviar para revisao</option><option value="published">Publicar agora</option></select>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" disabled={!isPaidPlan} checked={ad.featured} onChange={e=>setAd({...ad,featured:e.target.checked})}/>Destaque no guia {!isPaidPlan && <span className="text-xs font-normal text-stone-500">(plano pago)</span>}</label>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={commercial.autoRenew} onChange={e=>setCommercial({...commercial,autoRenew:e.target.checked})}/>Renovacao automatica</label>
        </div>
        {allowsCustomPage && <section className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="font-extrabold text-blue-950">Pagina personalizada do cliente</h4>
          <p className="mt-1 text-xs text-blue-800">Use letras minusculas, numeros e hifens. O endereco sera <b>nome.guiacomararaquara.com.br</b>.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-xs font-bold text-stone-600">Endereco da pagina<input required className={`${inputClass} mt-1 w-full`} placeholder="ex.: pizzaria-do-joao" value={marketing.subdomain} onChange={e=>setMarketing({...marketing,subdomain:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")})}/></label>
            <label className="text-xs font-bold text-stone-600">Meta Pixel (opcional)<input className={`${inputClass} mt-1 w-full`} placeholder="ex.: 123456789" value={marketing.metaPixelId} onChange={e=>setMarketing({...marketing,metaPixelId:e.target.value})}/></label>
            <label className="text-xs font-bold text-stone-600">Google Analytics (opcional)<input className={`${inputClass} mt-1 w-full`} placeholder="ex.: G-XXXXXXXXXX" value={marketing.googleAnalyticsId} onChange={e=>setMarketing({...marketing,googleAnalyticsId:e.target.value})}/></label>
            <label className="text-xs font-bold text-stone-600">Google Ads (opcional)<input className={`${inputClass} mt-1 w-full`} placeholder="ex.: AW-XXXXXXXXX" value={marketing.googleAdsId} onChange={e=>setMarketing({...marketing,googleAdsId:e.target.value})}/></label>
          </div>
        </section>}
        <div className="mt-5 rounded-lg bg-stone-50 p-4 text-sm"><b>{advertisers.find(item=>item.id===existingAdvertiserId)?.name || advertiser.name}</b> → <b>{establishment.name}</b> → {ad.title}</div>
        <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setStep(3)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold"><ArrowLeft className="h-4 w-4"/>Voltar</button><button disabled={saving} className="min-h-10 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{saving?"Salvando...":"Concluir cadastro"}</button></div>
      </form>}
    </div>
  );
}

function NextButton() {
  return <div className="mt-5 flex justify-end"><button className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-bold text-white">Continuar<ArrowRight className="h-4 w-4"/></button></div>;
}

function WizardNavigation({back}:{back:()=>void}) {
  return <div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={back} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold"><ArrowLeft className="h-4 w-4"/>Voltar</button><button className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-stone-900 px-3 py-2 text-sm font-bold text-white">Continuar<ArrowRight className="h-4 w-4"/></button></div>;
}
