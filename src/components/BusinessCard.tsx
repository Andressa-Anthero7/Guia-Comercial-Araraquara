import { Business } from "../types";
import { Star, MapPin, Phone, MessageSquare, ArrowUpRight } from "lucide-react";
import { CATEGORIES } from "../data";

interface BusinessCardProps {
  key?: string;
  business: Business;
  onOpenDetails: (business: Business) => void;
}

export function BusinessCard({ business, onOpenDetails }: BusinessCardProps) {
  // Find the category display name
  const catObj = CATEGORIES.find((c) => c.slug === business.category);
  const categoryName = catObj ? catObj.name : business.category;

  // Custom WhatsApp link
  const waMessage = encodeURIComponent(
    `Olá! Vi seu anúncio no Guia Comercial Araraquara e gostaria de mais informações.`
  );
  const whatsappUrl = `https://wa.me/${business.whatsapp}?text=${waMessage}`;

  return (
    <div 
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg"
      id={`business-card-${business.id}`}
    >
      {/* Image and Badges */}
      <div className="relative h-48 w-full overflow-hidden bg-stone-100">
        <img
          src={business.image}
          alt={business.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3 rounded-md bg-stone-900/80 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          {categoryName}
        </div>

        {/* Featured Badge */}
        {business.isFeatured && (
          <div className="absolute top-3 right-3 flex items-center space-x-1 rounded-md bg-amber-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-950 shadow-sm animate-pulse">
            <span>⭐ DESTAQUE</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        
        {/* Rating and Neighborhood */}
        <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
          <div className="flex items-center space-x-1 text-amber-500">
            <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
            <span className="text-stone-900 font-bold">{business.rating.toFixed(1)}</span>
            <span className="text-stone-400 font-normal">({business.reviewsCount})</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="h-3.5 w-3.5 text-stone-400" />
            <span>{business.neighborhood}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-2 text-lg font-bold text-stone-900 tracking-tight line-clamp-1 group-hover:text-amber-600 transition-colors">
          {business.name}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-xs text-stone-500 line-clamp-2 flex-1">
          {business.description}
        </p>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1">
          {business.tags.slice(0, 3).map((tag, i) => (
            <span 
              key={i} 
              className="rounded-md bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-600 border border-stone-100"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Separator */}
        <div className="my-4 border-t border-stone-100" />

        {/* CTA Buttons */}
        <div className="flex items-center space-x-2">
          
          {/* WhatsApp Direct */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center space-x-1.5 rounded-xl bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-colors"
            title="Conversar no WhatsApp"
            id={`business-whatsapp-${business.id}`}
          >
            <MessageSquare className="h-3.5 w-3.5 fill-emerald-600/10" />
            <span>WhatsApp</span>
          </a>

          {/* Details trigger */}
          <button
            onClick={() => onOpenDetails(business)}
            className="flex items-center justify-center space-x-1 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-stone-800 transition-all cursor-pointer"
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
