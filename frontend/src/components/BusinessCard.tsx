import { Business } from "../types";
import { Star, MapPin, MessageSquare, ArrowUpRight, BadgeCheck } from "lucide-react";
import { CATEGORIES } from "../data";

interface BusinessCardProps {
  key?: string;
  business: Business;
  onOpenDetails: (business: Business) => void;
}

export function BusinessCard({ business, onOpenDetails }: BusinessCardProps) {
  const category = CATEGORIES.find((item) => item.slug === business.category);
  const categoryName = category ? category.name : business.category;
  const coverImage = business.images?.[0] || business.image;
  const waMessage = encodeURIComponent(
    "Ola! Vi seu anuncio no Guia Comercial Araraquara e gostaria de mais informacoes."
  );
  const whatsappUrl = `https://wa.me/${business.whatsapp}?text=${waMessage}`;

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md"
      id={`business-card-${business.id}`}
    >
      <div
        className={`relative w-full overflow-hidden bg-stone-100 ${
          business.imageDisplay === "full" ? "aspect-square" : "h-40"
        }`}
      >
        <img
          src={coverImage}
          alt={business.name}
          className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${
            business.imageDisplay === "full" ? "object-contain" : "object-cover"
          }`}
          referrerPolicy="no-referrer"
        />

        <div className="absolute left-3 top-3 rounded-md bg-stone-900/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
          {categoryName}
        </div>

        {business.isFeatured && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-amber-400 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-stone-950 shadow-sm">
            <BadgeCheck className="h-3 w-3" />
            <span>Destaque</span>
          </div>
        )}

        {business.logoImage && (
          <div className="absolute bottom-3 left-3 flex h-12 w-12 items-center justify-center rounded-lg border border-white/80 bg-white p-1 shadow-sm">
            <img src={business.logoImage} alt={`Logomarca ${business.name}`} className="max-h-full max-w-full object-contain" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold text-stone-500">
          <div className="flex items-center space-x-1 text-amber-500">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            <span className="font-bold text-stone-900">{business.rating.toFixed(1)}</span>
            <span className="font-normal text-stone-400">({business.reviewsCount})</span>
          </div>
          <div className="flex min-w-0 items-center space-x-1">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-stone-400" />
            <span className="truncate">{business.neighborhood}</span>
          </div>
        </div>

        <h3 className="mt-2 text-base font-bold tracking-tight text-stone-900 line-clamp-1 group-hover:text-amber-600">
          {business.name}
        </h3>

        <p className="mt-1.5 flex-1 text-xs leading-relaxed text-stone-500 line-clamp-2">
          {business.description}
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {business.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-stone-100 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-600"
            >
              #{tag}
            </span>
          ))}
        </div>

        <div className="my-3 border-t border-stone-100" />

        <div className="flex items-center space-x-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center space-x-1.5 rounded-lg border border-emerald-100 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
            title="Conversar no WhatsApp"
            id={`business-whatsapp-${business.id}`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>WhatsApp</span>
          </a>

          <button
            onClick={() => onOpenDetails(business)}
            className="flex items-center justify-center space-x-1 rounded-lg bg-stone-900 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-stone-800"
            id={`business-details-btn-${business.id}`}
          >
            <span>Ver</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
