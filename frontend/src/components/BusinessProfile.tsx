import { useState, type FormEvent, type ReactNode } from "react";
import { Check, Clock, Copy, Gift, Globe2, Instagram, Mail, MapPin, MessageSquare, Phone, Send, Star, Store, User, X } from "lucide-react";
import { useCategories } from "../categories";
import type { Business, Coupon, Review } from "../types";

export interface BusinessProfileProps {
  business: Business;
  reviews: Review[];
  coupons: Coupon[];
  reviewsUnavailable?: boolean;
  onSubmitReview: (review: Omit<Review, "id" | "date">) => Promise<void>;
}

type Props = BusinessProfileProps & {
  presentation: "modal" | "page";
  onClose?: () => void;
};

function websiteLink(value?: string) {
  if (!value?.trim()) return undefined;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(value.trim()) ? value.trim() : `https://${value.trim()}`);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function instagramHandle(value?: string) {
  const handle = value?.trim().replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i, "").replace(/^@/, "").split(/[/?#]/)[0];
  return handle && /^[\w.]+$/.test(handle) ? handle : undefined;
}

function displayDate(value: string) {
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
}

export function BusinessProfile({ business, reviews, coupons, reviewsUnavailable = false, onSubmitReview, presentation, onClose }: Props) {
  const categories = useCategories();
  const isPage = presentation === "page";
  const prefix = isPage ? "landing" : "modal";
  const Title = isPage ? "h1" : "h2";
  const SectionTitle = isPage ? "h2" : "h3";
  const categoryName = categories.find((category) => category.slug === business.category)?.name ?? business.category;
  const businessReviews = reviews.filter((review) => review.businessId === business.id);
  const businessCoupons = coupons.filter((coupon) => coupon.businessId === business.id);
  const gallery = Array.from(new Set((business.images ?? []).filter((photo) => photo && photo !== business.image)));
  const streetAddress = business.street ? [business.street, business.number].filter(Boolean).join(", ") : business.address;
  const cityState = [business.city, business.state].filter(Boolean).join(" - ");
  const addressLines = [streetAddress, business.complement, business.neighborhood, cityState, business.postalCode ? `CEP ${business.postalCode}` : ""].filter(Boolean);
  const hasAddress = addressLines.length > 0;
  const mapsQuery = encodeURIComponent([business.name, ...addressLines].join(", "));
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const mapsEmbedUrl = `https://www.google.com/maps?output=embed&q=${mapsQuery}`;
  const whatsappUrl = business.whatsapp ? `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(`Olá! Vi a página de ${business.name} no Guia Comercial Araraquara e gostaria de mais informações.`)}` : undefined;
  const websiteUrl = websiteLink(business.website);
  const instagram = instagramHandle(business.instagram);
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewNotice, setReviewNotice] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [copyError, setCopyError] = useState("");

  async function handleReviewSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!authorName.trim() || !comment.trim()) {
      setReviewNotice({ kind: "error", message: "Preencha seu nome e conte sua experiência para enviar a avaliação." });
      return;
    }
    setSubmitting(true);
    setReviewNotice(null);
    try {
      await onSubmitReview({ businessId: business.id, author: authorName.trim(), rating, comment: comment.trim() });
      setAuthorName("");
      setRating(5);
      setComment("");
      setReviewNotice({ kind: "success", message: "Avaliação enviada! Ela será publicada após a moderação." });
    } catch (reason) {
      setReviewNotice({ kind: "error", message: reason instanceof Error ? reason.message : "Não foi possível enviar a avaliação. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyCoupon(code: string, id: string) {
    setCopyError("");
    setCopiedCouponId(null);
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCouponId(id);
    } catch {
      setCopyError("Não foi possível copiar automaticamente. Selecione o código do cupom e copie para usar na empresa.");
    }
  }

  return (
    <>
      <div className={`relative isolate flex shrink-0 items-end overflow-hidden bg-stone-900 ${isPage ? "min-h-56 sm:min-h-64" : "min-h-56 sm:min-h-72"}`}>
        {business.image ? (
          <img src={business.image} alt={business.name} className="absolute inset-0 -z-20 h-full w-full object-cover" referrerPolicy="no-referrer" fetchPriority="high" />
        ) : <Store className="absolute right-8 top-8 -z-20 h-40 w-40 text-stone-700" aria-hidden="true" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
        {onClose && <button onClick={onClose} className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-colors hover:bg-white/40" aria-label="Fechar" id="modal-close-btn"><X className="h-6 w-6" /></button>}
        <div className="w-full px-6 pb-6 pt-16 text-white sm:px-8 sm:pb-8">
          <div className="flex items-end gap-4">
            {business.logoImage && <img src={business.logoImage} alt={`Logomarca ${business.name}`} className="h-14 w-14 shrink-0 rounded-xl border-2 border-white bg-white object-contain shadow-lg sm:h-20 sm:w-20 sm:rounded-2xl sm:border-4" />}
            <div className="min-w-0">
              {categoryName && <span className="inline-flex rounded-md bg-amber-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-stone-950">{categoryName}</span>}
              <Title id={`${prefix}-business-name`} className={`mt-2 break-words font-extrabold tracking-tight ${isPage ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}>{business.name}</Title>
              {hasAddress && <p className="mt-2 flex items-start gap-1.5 text-sm text-stone-200"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" /><span>{[streetAddress, business.neighborhood, cityState].filter(Boolean).join(" · ")}</span></p>}
            </div>
          </div>
        </div>
      </div>

      {isPage && (whatsappUrl || hasAddress) && <nav aria-label="Ações da empresa" className="flex flex-wrap gap-3 border-b border-stone-100 bg-stone-50/70 px-6 py-4 sm:px-8">
        {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700 sm:flex-none"><MessageSquare className="h-4 w-4" />Falar no WhatsApp</a>}
        {hasAddress && <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 sm:flex-none"><MapPin className="h-4 w-4" />Como chegar</a>}
      </nav>}

      <div className={`grid grid-cols-1 gap-8 p-6 sm:p-8 md:grid-cols-5 ${isPage ? "" : "max-h-[60vh] overflow-y-auto sm:max-h-[65vh]"}`}>
        <div className="min-w-0 space-y-6 md:col-span-3">
          <section aria-label="Sobre a empresa">
            <SectionTitle className="text-lg font-bold text-stone-900">Sobre o Negócio</SectionTitle>
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-stone-600">{business.description}</p>
            {business.tags.length > 0 && <ul aria-label="Especialidades da empresa" className="mt-4 flex flex-wrap gap-2">{Array.from(new Set(business.tags)).map((tag) => <li key={tag} className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600">{tag}</li>)}</ul>}
          </section>

          {business.servicesProducts?.trim() && <section className="border-t border-stone-100 pt-6" aria-label="Serviços e produtos">
            <SectionTitle className="text-lg font-bold text-stone-900">Serviços e produtos</SectionTitle>
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-stone-600">{business.servicesProducts}</p>
          </section>}

          {gallery.length > 0 && <section aria-label="Galeria da empresa" className="border-t border-stone-100 pt-6">
            <SectionTitle className="text-lg font-bold text-stone-900">Conheça a empresa</SectionTitle>
            <div className="mt-4 grid grid-cols-2 gap-3">{gallery.map((photo, index) => <a key={photo} href={photo} target="_blank" rel="noopener noreferrer" aria-label={`Ampliar foto ${index + 1} de ${business.name}`} className="overflow-hidden rounded-xl bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"><img loading="lazy" src={photo} alt={`${business.name} - foto ${index + 1}`} className="aspect-[4/3] w-full object-cover transition-transform hover:scale-105" /></a>)}</div>
          </section>}

          {businessCoupons.length > 0 && <section aria-label="Cupons disponíveis" className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <SectionTitle className="flex items-center gap-2 text-base font-bold text-amber-900"><Gift className="h-5 w-5 shrink-0 text-amber-600" />Cupons Disponíveis ({businessCoupons.length})</SectionTitle>
            {businessCoupons.map((coupon) => <div key={coupon.id} className="space-y-3 rounded-xl border border-amber-100 bg-white p-4">
              <p className="break-words text-sm font-semibold text-stone-900">{coupon.description}</p>
              {coupon.expiryDate && displayDate(coupon.expiryDate) && <p className="text-xs text-stone-500">Válido até {displayDate(coupon.expiryDate)}</p>}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <code className="break-all rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-950">{coupon.discountCode}</code>
                <button type="button" onClick={() => void handleCopyCoupon(coupon.discountCode, coupon.id)} id={`${prefix}-copy-coupon-${coupon.id}`} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400" aria-label={`Copiar cupom ${coupon.discountCode}`}>
                  {copiedCouponId === coupon.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span aria-live="polite">{copiedCouponId === coupon.id ? "Copiado!" : "Copiar cupom"}</span>
                </button>
              </div>
            </div>)}
            {copyError && <p role="alert" className="text-sm text-amber-900">{copyError}</p>}
          </section>}
        </div>

        <aside aria-label="Contato e localização" className="min-w-0 space-y-5 md:col-span-2 md:row-span-2">
          <section className="space-y-5 rounded-2xl border border-stone-200 p-5">
            <SectionTitle className="text-base font-bold text-stone-900">Contatos & Horários</SectionTitle>
            <ContactItem icon={<Clock />} title="Horário de Funcionamento"><span className="whitespace-pre-line">{business.hours || "Consulte a empresa para saber os horários."}</span></ContactItem>
            {business.phone && <ContactItem icon={<Phone />} title="Telefone Comercial"><a href={`tel:${business.phone.replace(/[^\d+]/g, "")}`} className="hover:text-amber-700 hover:underline">{business.phone}</a></ContactItem>}
            {business.email && <ContactItem icon={<Mail />} title="E-mail"><a href={`mailto:${business.email}`} className="break-all hover:text-amber-700 hover:underline">{business.email}</a></ContactItem>}
            {websiteUrl && <ContactItem icon={<Globe2 />} title="Site"><a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-amber-700 hover:underline">{business.website}</a></ContactItem>}
            {instagram && <ContactItem icon={<Instagram />} title="Instagram"><a href={`https://www.instagram.com/${instagram}/`} target="_blank" rel="noopener noreferrer" className="break-all font-semibold text-amber-700 hover:underline">@{instagram}</a></ContactItem>}
            {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-bold text-white transition-colors hover:bg-emerald-700" id={`${prefix}-whatsapp-cta`}><MessageSquare className="h-4 w-4 shrink-0" />Conversar no WhatsApp</a>}
          </section>

          {hasAddress && <section className="space-y-4 rounded-2xl border border-stone-200 p-5">
            <SectionTitle className="text-base font-bold text-stone-900">Como Chegar</SectionTitle>
            <address className="flex items-start gap-2.5 text-sm not-italic leading-relaxed text-stone-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><span>{addressLines.map((line, index) => <span key={index} className="block break-words">{line}</span>)}</span></address>
            <div className="h-44 overflow-hidden rounded-xl border border-stone-200 bg-stone-100"><iframe id={`${prefix}-maps-embed`} title={`Mapa de ${business.name}`} src={mapsEmbedUrl} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
            <a href={mapsSearchUrl} target="_blank" rel="noopener noreferrer" id={`${prefix}-maps-redirect`} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-center text-xs font-semibold text-stone-700 transition-colors hover:bg-stone-100">Ver no Google Maps</a>
          </section>}
        </aside>

        <section aria-label="Avaliações da empresa" className="min-w-0 space-y-5 border-t border-stone-100 pt-6 md:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle className="text-lg font-bold text-stone-900">Avaliações{!reviewsUnavailable && ` (${businessReviews.length})`}</SectionTitle>
            {business.reviewsCount > 0 && <div className="flex items-center gap-1.5 text-sm" aria-label={`Nota ${business.rating.toFixed(1)} de 5`}><Star className="h-4 w-4 fill-amber-400 text-amber-500" /><span className="font-bold text-stone-900">{business.rating.toFixed(1)}</span><span className="text-stone-400">/ 5</span></div>}
          </div>
          {reviewsUnavailable ? <p role="alert" className="text-sm text-amber-800">As avaliações estão indisponíveis no momento.</p> : businessReviews.length === 0 ? <p className="text-sm text-stone-500">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p> : <div className="space-y-3">
            {businessReviews.map((review) => <article key={review.id} className="rounded-2xl border border-stone-100 bg-stone-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-600"><User className="h-4 w-4" /></span><div className="min-w-0"><p className="break-words text-sm font-bold text-stone-900">{review.author}</p><p className="text-xs text-stone-500">{displayDate(review.date)}</p></div></div>
                <div className="flex gap-0.5" aria-label={`${review.rating} de 5 estrelas`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`h-3.5 w-3.5 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} />)}</div>
              </div>
              <p className="mt-3 whitespace-pre-line break-words text-sm leading-relaxed text-stone-600">{review.comment}</p>
            </article>)}
          </div>}

          <form onSubmit={handleReviewSubmit} aria-label="Deixe sua avaliação" aria-busy={submitting} className="space-y-4 rounded-2xl border border-stone-200 p-5">
            <div><h3 className="text-base font-bold text-stone-900">Deixe sua Avaliação</h3><p className="mt-1 text-xs leading-relaxed text-stone-500">Compartilhe sua experiência. As avaliações passam por moderação antes de aparecer no guia.</p></div>
            <fieldset disabled={submitting} className="space-y-4 disabled:opacity-60">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label htmlFor="review-author-input" className="mb-1.5 block text-xs font-semibold text-stone-600">Seu Nome</label><input type="text" required autoComplete="name" maxLength={120} placeholder="Seu nome completo" value={authorName} onChange={(event) => setAuthorName(event.target.value)} className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-950 focus:outline-hidden focus:ring-2 focus:ring-amber-500" id="review-author-input" /></div>
                <div><span id={`${prefix}-rating-label`} className="mb-1.5 block text-xs font-semibold text-stone-600">Sua Nota</span><div role="group" aria-labelledby={`${prefix}-rating-label`} className="flex">{Array.from({ length: 5 }, (_, index) => <button key={index} type="button" onClick={() => setRating(index + 1)} aria-label={`${index + 1} ${index === 0 ? "estrela" : "estrelas"}`} aria-pressed={rating === index + 1} id={`star-rating-select-${index + 1}`} className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-amber-500"><Star className={`h-6 w-6 ${index < rating ? "fill-amber-400 text-amber-400" : "text-stone-300"}`} /></button>)}</div></div>
              </div>
              <div><label htmlFor="review-comment-textarea" className="mb-1.5 block text-xs font-semibold text-stone-600">Seu Comentário</label><textarea required rows={3} placeholder="Conte sua experiência com este estabelecimento..." value={comment} onChange={(event) => setComment(event.target.value)} className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm text-stone-950 focus:outline-hidden focus:ring-2 focus:ring-amber-500" id="review-comment-textarea" /></div>
              <button type="submit" className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-stone-900 px-3 py-3 text-sm font-bold text-white hover:bg-stone-800 disabled:cursor-wait" id="submit-review-btn"><Send className="h-4 w-4 text-amber-400" />{submitting ? "Enviando..." : "Enviar Avaliação"}</button>
            </fieldset>
            {reviewNotice && <p role={reviewNotice.kind === "error" ? "alert" : "status"} className={`rounded-xl p-3 text-sm ${reviewNotice.kind === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>{reviewNotice.message}</p>}
          </form>
        </section>
      </div>
    </>
  );
}

function ContactItem({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <div className="flex items-start gap-2.5 text-sm text-stone-600"><span className="mt-0.5 shrink-0 text-stone-400 [&>svg]:h-4 [&>svg]:w-4">{icon}</span><div className="min-w-0"><p className="text-xs font-bold text-stone-900">{title}</p><div className="mt-1 leading-relaxed">{children}</div></div></div>;
}
