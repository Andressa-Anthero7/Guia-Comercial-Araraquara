import { ArrowLeft, Clock3, Gift, Globe2, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { Business, Coupon } from "../types";

interface Props {
  business: Business;
  coupons: Coupon[];
}

const GUIDE_URL = "https://www.guiacomararaquara.com.br";

export function BusinessLandingPage({ business, coupons }: Props) {
  const photos = Array.from(new Set([business.image, ...(business.images ?? [])].filter(Boolean)));
  const businessCoupons = coupons.filter((coupon) => coupon.businessId === business.id);
  const whatsappUrl = `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(`Ola! Vi a pagina de ${business.name} no Guia Comercial Araraquara e gostaria de mais informacoes.`)}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name}, ${business.address}, Araraquara - SP`)}`;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href={GUIDE_URL} className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-amber-700">
            <ArrowLeft className="h-4 w-4" /> Guia Comercial Araraquara
          </a>
          {business.logoImage && <img src={business.logoImage} alt={`Logomarca ${business.name}`} className="h-10 max-w-28 object-contain" />}
        </div>
      </header>

      <section className="relative min-h-[28rem] overflow-hidden bg-stone-900">
        <img src={photos[0]} alt={business.name} className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/55 to-stone-950/10" />
        <div className="relative mx-auto flex min-h-[28rem] max-w-6xl flex-col justify-end px-4 py-12 text-white sm:px-6 sm:py-16">
          <span className="mb-3 w-fit rounded-full bg-amber-400 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-stone-950">Empresa parceira</span>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">{business.name}</h1>
          <p className="mt-4 max-w-2xl whitespace-pre-line text-base leading-relaxed text-stone-100 sm:text-lg">{business.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-white shadow-lg hover:bg-emerald-600"><MessageCircle className="h-5 w-5" />Falar no WhatsApp</a>
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-extrabold text-white hover:bg-white/20"><MapPin className="h-5 w-5" />Como chegar</a>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.45fr_.55fr]">
        <section className="space-y-8">
          {business.servicesProducts && <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-extrabold">Servicos e produtos</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-600">{business.servicesProducts}</p></div>}
          {photos.length > 1 && <div><h2 className="mb-4 text-xl font-extrabold">Conheca nosso espaco</h2><div className="grid gap-3 sm:grid-cols-2">{photos.slice(1).map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={`${business.name} - imagem ${index + 2}`} className="h-56 w-full rounded-2xl object-cover shadow-sm" />)}</div></div>}
          {businessCoupons.length > 0 && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="flex items-center gap-2 text-xl font-extrabold text-amber-950"><Gift className="h-5 w-5" />Ofertas especiais</h2><div className="mt-4 grid gap-3">{businessCoupons.map((coupon) => <div key={coupon.id} className="rounded-xl border border-amber-200 bg-white p-4"><b className="text-sm text-stone-900">{coupon.description}</b><div className="mt-2 w-fit rounded-md bg-amber-400 px-2.5 py-1 text-xs font-extrabold text-stone-950">{coupon.discountCode}</div></div>)}</div></div>}
        </section>

        <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-extrabold">Contato</h2>
          <div className="mt-5 space-y-4 text-sm text-stone-600">
            <Info icon={<Phone className="h-4 w-4" />} title="Telefone" value={business.phone} />
            <Info icon={<Clock3 className="h-4 w-4" />} title="Horario" value={business.hours || "Consulte a empresa"} />
            <Info icon={<MapPin className="h-4 w-4" />} title="Endereco" value={`${business.address} - ${business.neighborhood}`} />
            {business.website && <Info icon={<Globe2 className="h-4 w-4" />} title="Site" value={business.website} link={business.website} />}
            {business.instagram && <Info icon={<Instagram className="h-4 w-4" />} title="Instagram" value={`@${business.instagram.replace("@", "")}`} link={`https://instagram.com/${business.instagram.replace("@", "")}`} />}
          </div>
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-emerald-600"><MessageCircle className="h-5 w-5" />Chamar no WhatsApp</a>
        </aside>
      </div>
    </main>
  );
}

function Info({ icon, title, value, link }: { icon: ReactNode; title: string; value: string; link?: string }) {
  const content = link ? <a className="break-all font-semibold text-amber-700 hover:underline" href={link} target="_blank" rel="noreferrer">{value}</a> : <span className="font-semibold text-stone-800">{value}</span>;
  return <div className="flex gap-3"><span className="mt-0.5 text-amber-600">{icon}</span><div><div className="text-xs font-bold uppercase tracking-wide text-stone-400">{title}</div>{content}</div></div>;
}
