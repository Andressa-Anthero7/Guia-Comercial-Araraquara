import { Search, MapPin, Navigation } from "lucide-react";
import { NEIGHBORHOODS } from "../data";

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedNeighborhood: string;
  setSelectedNeighborhood: (neighborhood: string) => void;
}

export function Hero({
  searchQuery,
  setSearchQuery,
  selectedNeighborhood,
  setSelectedNeighborhood
}: HeroProps) {
  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-2">
            <div className="grid gap-2 md:grid-cols-[1fr_240px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Pesquisar anunciantes, produtos ou servicos"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-12 w-full rounded-md border border-stone-200 bg-white pl-10 pr-3 text-sm font-medium text-stone-950 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  id="search-input"
                />
              </label>

              <label className="relative block">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                <select
                  value={selectedNeighborhood}
                  onChange={(event) => setSelectedNeighborhood(event.target.value)}
                  className="h-12 w-full appearance-none rounded-md border border-stone-200 bg-white pl-10 pr-9 text-sm font-medium text-stone-950 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                  id="neighborhood-select"
                >
                  <option value="">Todos os bairros</option>
                  {NEIGHBORHOODS.map((neighborhood) => (
                    <option key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </option>
                  ))}
                </select>
                <Navigation className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-stone-400" />
              </label>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
