import { useState } from "react";
import { Coupon, Business } from "../types";
import { Gift, Copy, Check, ExternalLink, Ticket } from "lucide-react";

interface CouponSectionProps {
  coupons: Coupon[];
  businesses: Business[];
  onOpenBusinessDetails: (business: Business) => void;
}

export function CouponSection({ coupons, businesses, onOpenBusinessDetails }: CouponSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGoToBusiness = (businessId: string) => {
    const biz = businesses.find((b) => b.id === businessId);
    if (biz) {
      onOpenBusinessDetails(biz);
    }
  };

  return (
    <section id="cupons" className="py-16 bg-gradient-to-b from-white to-stone-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-100">
            <Ticket className="h-3.5 w-3.5 text-rose-500" />
            <span>Economize em Araraquara 🏷️</span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-stone-900 tracking-tight sm:text-4xl">
            Cupons de Desconto Exclusivos
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-500">
            Aproveite as ofertas especiais preparadas pelos comerciantes parceiros do nosso guia.
            Basta copiar o código e apresentar na compra!
          </p>
        </div>

        {/* Coupons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.map((coupon) => {
            const isCopied = copiedId === coupon.id;
            
            return (
              <div
                key={coupon.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border-2 border-dashed border-stone-200 bg-white p-6 shadow-xs transition-all duration-300 hover:border-amber-400 hover:shadow-md"
                id={`coupon-card-${coupon.id}`}
              >
                {/* Visual side notches representing physical ticket */}
                <div className="absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full bg-stone-50 border-r border-stone-200" />
                <div className="absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full bg-stone-50 border-l border-stone-200" />

                <div>
                  {/* Top line with discount badge */}
                  <div className="flex items-center justify-between">
                    <span 
                      onClick={() => handleGoToBusiness(coupon.businessId)}
                      className="text-xs font-extrabold text-amber-600 hover:underline cursor-pointer flex items-center"
                    >
                      {coupon.businessName}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </span>
                    <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-100">
                      Válido
                    </span>
                  </div>

                  {/* Coupon Title */}
                  <h3 className="mt-3 font-display text-base font-extrabold text-stone-900 leading-snug">
                    {coupon.description}
                  </h3>

                  {/* Expiration date */}
                  <p className="mt-1.5 text-[11px] text-stone-400">
                    Vence em: {new Date(coupon.expiryDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                {/* Dashed line and promo code */}
                <div className="mt-6 pt-5 border-t border-dashed border-stone-200">
                  <div className="flex items-center justify-between gap-3">
                    
                    {/* Visual coupon tag */}
                    <div className="flex-1 bg-stone-50 border border-stone-200 px-3.5 py-2.5 rounded-xl font-mono text-xs font-bold text-stone-700 tracking-wider text-center select-all">
                      {coupon.discountCode}
                    </div>

                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopyCode(coupon.discountCode, coupon.id)}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer ${
                        isCopied
                          ? "bg-emerald-500 text-white"
                          : "bg-stone-900 text-white hover:bg-stone-800"
                      }`}
                      title={isCopied ? "Código Copiado!" : "Copiar Código"}
                      id={`copy-coupon-btn-${coupon.id}`}
                    >
                      {isCopied ? <Check className="h-4.5 w-4.5" /> : <Copy className="h-4.5 w-4.5" />}
                    </button>

                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
