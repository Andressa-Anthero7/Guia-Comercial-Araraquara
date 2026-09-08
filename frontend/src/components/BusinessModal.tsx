import { useState, FormEvent } from "react";
import { Business, Review, Coupon } from "../types";
import { X, MapPin, Phone, Clock, MessageSquare, Instagram, Star, Calendar, User, ThumbsUp, Send, Gift } from "lucide-react";
import { CATEGORIES } from "../data";

interface BusinessModalProps {
  business: Business;
  reviews: Review[];
  coupons: Coupon[];
  onClose: () => void;
  onSubmitReview: (review: Omit<Review, "id" | "date">) => Promise<void>;
}

export function BusinessModal({ business, reviews, coupons, onClose, onSubmitReview }: BusinessModalProps) {
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  // Filter reviews and coupons for this business
  const businessReviews = reviews.filter((r) => r.businessId === business.id);
  const businessCoupons = coupons.filter((c) => c.businessId === business.id);

  // Find category display name
  const catObj = CATEGORIES.find((c) => c.slug === business.category);
  const categoryName = catObj ? catObj.name : business.category;

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) return;

    try {
      await onSubmitReview({
        businessId: business.id,
        author: authorName,
        rating,
        comment
      });
      setAuthorName("");
      setRating(5);
      setComment("");
      window.alert("Avaliacao enviada para moderacao.");
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : "Nao foi possivel enviar.");
    }
  };

  const handleCopyCoupon = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponId(id);
    setTimeout(() => setCopiedCouponId(null), 2000);
  };

  // Custom WhatsApp Link
  const waMessage = encodeURIComponent(
    `Olá! Vi seu anúncio no Guia Comercial Araraquara e gostaria de mais informações.`
  );
  const whatsappUrl = `https://wa.me/${business.whatsapp}?text=${waMessage}`;

  // Custom Google Maps Link
  const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    business.name + ", " + business.address + ", Araraquara - SP"
  )}`;
  const mapsEmbedUrl = `https://www.google.com/maps?output=embed&q=${encodeURIComponent(
    business.name + ", " + business.address + ", Araraquara - SP"
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden my-8"
        id="business-detail-modal"
      >
        {/* Header Cover Image */}
        <div className="relative h-64 sm:h-80 bg-stone-100">
          <img
            src={business.image}
            alt={business.name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 backdrop-blur-md transition-colors cursor-pointer"
            aria-label="Fechar"
            id="modal-close-btn"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Business Core Info overlay */}
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="inline-flex items-center rounded-md bg-amber-500/90 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-stone-950">
              {categoryName}
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              {business.name}
            </h2>
            <p className="mt-1 flex items-center text-xs sm:text-sm text-stone-200">
              <MapPin className="mr-1.5 h-4 w-4 text-amber-400" />
              {business.address} - {business.neighborhood}
            </p>
          </div>
        </div>

        {/* Modal Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 p-6 sm:p-8 max-h-[60vh] sm:max-h-[65vh] overflow-y-auto">
          
          {/* Left Column (Core Details & Description) */}
          <div className="md:col-span-3 space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-stone-900">Sobre o Negócio</h3>
              <p className="mt-2 text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {business.description}
              </p>
            </div>

            {/* Coupons Section if any */}
            {businessCoupons.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                <div className="flex items-center space-x-2 text-amber-800">
                  <Gift className="h-5 w-5 text-amber-600 fill-amber-500/10" />
                  <h4 className="font-display text-sm font-bold uppercase tracking-wide">
                    Cupons Disponíveis ({businessCoupons.length})
                  </h4>
                </div>
                
                {businessCoupons.map((coupon) => (
                  <div 
                    key={coupon.id} 
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-amber-100 p-3 rounded-xl shadow-xs"
                  >
                    <div>
                      <p className="text-xs text-stone-500 font-medium">Cupom de Desconto</p>
                      <p className="text-sm font-semibold text-stone-900">{coupon.description}</p>
                    </div>
                    <button
                      onClick={() => handleCopyCoupon(coupon.discountCode, coupon.id)}
                      className={`w-full sm:w-auto px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        copiedCouponId === coupon.id
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-amber-500 border-amber-500 text-stone-950 hover:bg-amber-600"
                      }`}
                      id={`modal-copy-coupon-${coupon.id}`}
                    >
                      {copiedCouponId === coupon.id ? "Copiado!" : coupon.discountCode}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Reviews list */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-stone-900">
                  Avaliações ({businessReviews.length})
                </h3>
                <div className="flex items-center space-x-1 text-amber-500">
                  <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-500" />
                  <span className="text-sm font-bold text-stone-900">
                    {business.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {businessReviews.length === 0 ? (
                <p className="text-sm text-stone-400 italic">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
              ) : (
                <div className="space-y-3.5">
                  {businessReviews.map((rev) => (
                    <div key={rev.id} className="rounded-2xl border border-stone-100 bg-stone-50/50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200 text-stone-600">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900">{rev.author}</p>
                            <p className="text-[10px] text-stone-400">
                              {new Date(rev.date).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < rev.rating ? "fill-amber-400 text-amber-400" : "text-stone-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-stone-600 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leave a review form */}
            <form onSubmit={handleReviewSubmit} className="rounded-2xl border border-stone-200 p-5 space-y-4">
              <h4 className="font-display text-sm font-bold text-stone-900">Deixe sua Avaliação</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Seu Nome</label>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome completo"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3.5 py-2 text-xs text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    id="review-author-input"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Sua Nota</label>
                  <div className="flex items-center space-x-1.5 h-9">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starVal = i + 1;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRating(starVal)}
                          className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                          title={`${starVal} Estrelas`}
                          id={`star-rating-select-${starVal}`}
                        >
                          <Star 
                            className={`h-6 w-6 ${
                              starVal <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300"
                            }`} 
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">Seu Comentário</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Conte sua experiência com este estabelecimento..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3.5 py-2.5 text-xs text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  id="review-comment-textarea"
                />
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center space-x-1.5 rounded-xl bg-stone-900 py-3 text-xs font-bold text-white hover:bg-stone-800 transition-colors cursor-pointer"
                id="submit-review-btn"
              >
                <Send className="h-3.5 w-3.5 text-amber-400" />
                <span>Enviar Avaliação</span>
              </button>
            </form>
          </div>

          {/* Right Column (Contact card & Map location) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Contacts Container */}
            <div className="rounded-2xl border border-stone-200 p-5 space-y-4">
              <h3 className="font-display text-sm font-bold text-stone-900">Contatos & Horários</h3>
              
              <div className="space-y-3.5">
                
                {/* Hours */}
                <div className="flex items-start space-x-2.5 text-xs text-stone-600">
                  <Clock className="h-4.5 w-4.5 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-stone-900">Horário de Funcionamento</p>
                    <p className="mt-0.5">{business.hours}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-2.5 text-xs text-stone-600">
                  <Phone className="h-4.5 w-4.5 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-stone-900">Telefone Comercial</p>
                    <p className="mt-0.5">{business.phone}</p>
                  </div>
                </div>

                {/* Instagram if any */}
                {business.instagram && (
                  <div className="flex items-start space-x-2.5 text-xs text-stone-600">
                    <Instagram className="h-4.5 w-4.5 text-stone-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-stone-900">Instagram</p>
                      <a 
                        href={`https://instagram.com/${business.instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 text-amber-600 hover:underline font-semibold block"
                      >
                        @{business.instagram}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat on WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-500 py-3 text-xs font-bold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-600 transition-colors"
                id="modal-whatsapp-cta"
              >
                <MessageSquare className="h-4.5 w-4.5 fill-white/10" />
                <span>Conversar no WhatsApp</span>
              </a>
            </div>

            {/* Map Location Box */}
            <div className="rounded-2xl border border-stone-200 p-5 space-y-3">
              <h3 className="font-display text-sm font-bold text-stone-900">Como Chegar</h3>
              
              <div className="h-36 w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                <iframe
                  id="modal-maps-embed"
                  title={`Mapa de ${business.name}`}
                  src={mapsEmbedUrl}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <a
                href={mapsSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center space-x-1.5 rounded-xl border border-stone-200 bg-stone-50 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors text-center"
                id="modal-maps-redirect"
              >
                <span>Ver no Google Maps</span>
              </a>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
