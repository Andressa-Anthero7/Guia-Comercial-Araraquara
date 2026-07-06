import React from "react";
import { Search, MapPin, Sparkles, Navigation } from "lucide-react";
import { NEIGHBORHOODS } from "../data";

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedNeighborhood: string;
  setSelectedNeighborhood: (neighborhood: string) => void;
  onQuickCategorySelect: (slug: string) => void;
  totalBusinesses: number;
}

export function Hero({
  searchQuery,
  setSearchQuery,
  selectedNeighborhood,
  setSelectedNeighborhood,
  onQuickCategorySelect,
  totalBusinesses
}: HeroProps) {
  
  const quickFilters = [
    { name: "Pizzas & Burguers", category: "gastronomia", icon: "🍕" },
    { name: "Beleza & Spa", category: "beleza", icon: "💅" },
    { name: "Oficinas Mecânicas", category: "automotivo", icon: "🚗" },
    { name: "Consultas & Clínicas", category: "saude", icon: "🩺" }
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-orange-50/20 to-white pt-10 pb-16 lg:pt-16 lg:pb-24">
      {/* Decorative Orbs */}
      <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-amber-200/30 blur-3xl" />
      <div className="absolute top-60 -left-40 h-[300px] w-[300px] rounded-full bg-orange-100/40 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 text-center">
          
          {/* Welcome Badge */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 animate-fade-in shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Guia Comercial Oficial da Morada do Sol ☀️</span>
          </div>

          {/* Heading */}
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-extrabold tracking-tight text-stone-900 sm:text-5xl md:text-6xl">
            Tudo o que você procura em{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                Araraquara
              </span>
              <span className="absolute bottom-1 left-0 h-3 w-full bg-amber-100/60 -skew-x-6 z-0" />
            </span>
          </h1>

          {/* Subtext */}
          <p className="mx-auto mt-6 max-w-2xl text-base text-stone-600 sm:text-lg">
            Encontre bares, restaurantes, mecânicas, dentistas, lojas e serviços perto de você. 
            Pegue cupons de desconto exclusivos e apoie os comerciantes locais!
          </p>

          {/* Integrated Search Console */}
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-stone-200 bg-white p-2 shadow-xl md:p-3">
            <div className="flex flex-col md:flex-row md:items-center">
              
              {/* Keyword Search */}
              <div className="relative flex-1">
                <Search className="absolute top-3.5 left-4 h-5 w-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="O que você está procurando? (Ex: pizzaria, mecânica...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border-0 py-3 pl-12 pr-4 text-sm text-stone-950 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  id="search-input"
                />
              </div>

              {/* Separator */}
              <div className="hidden h-8 w-px bg-stone-200 md:block" />

              {/* Neighborhood Selector */}
              <div className="relative flex-1 border-t border-stone-100 md:border-t-0">
                <MapPin className="absolute top-3.5 left-4 h-5 w-5 text-stone-400" />
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="w-full appearance-none rounded-xl border-0 py-3 pl-12 pr-8 text-sm text-stone-950 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-transparent cursor-pointer"
                  id="neighborhood-select"
                >
                  <option value="">Todos os Bairros</option>
                  {NEIGHBORHOODS.map((nb) => (
                    <option key={nb} value={nb}>
                      {nb}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <Navigation className="h-4 w-4 text-stone-400 rotate-90" />
                </div>
              </div>

            </div>
          </div>

          {/* Quick recommendations */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Buscas frequentes:
            </span>
            {quickFilters.map((q) => (
              <button
                key={q.name}
                onClick={() => onQuickCategorySelect(q.category)}
                className="flex items-center space-x-1.5 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 shadow-xs transition-colors hover:border-amber-400 hover:bg-amber-50 cursor-pointer"
                id={`quick-filter-${q.category}`}
              >
                <span>{q.icon}</span>
                <span>{q.name}</span>
              </button>
            ))}
          </div>

          {/* Localized stats */}
          <div className="mt-12 flex justify-center space-x-8 text-stone-500 sm:space-x-16">
            <div className="text-center">
              <div className="font-display text-3xl font-extrabold text-stone-900">{totalBusinesses}</div>
              <div className="text-xs font-medium text-stone-500">Parceiros Ativos</div>
            </div>
            <div className="border-r border-stone-200" />
            <div className="text-center">
              <div className="font-display text-3xl font-extrabold text-stone-900">100%</div>
              <div className="text-xs font-medium text-stone-500">Araraquarense 🇧🇷</div>
            </div>
            <div className="border-r border-stone-200" />
            <div className="text-center">
              <div className="font-display text-3xl font-extrabold text-stone-900">4</div>
              <div className="text-xs font-medium text-stone-500">Seções Úteis</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
