import { Category } from "../types";
import { CATEGORIES } from "../data";
import { CategoryIcon } from "./CategoryIcon";
import { Grid } from "lucide-react";

interface CategoryListProps {
  selectedCategory: string | null;
  setSelectedCategory: (category: string | null) => void;
}

export function CategoryList({ selectedCategory, setSelectedCategory }: CategoryListProps) {
  return (
    <section className="py-10 bg-stone-50/50 border-y border-stone-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-900 tracking-tight">
              Explore por Categorias
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Selecione uma categoria para filtrar os comércios locais
            </p>
          </div>
          
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="mt-2 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors cursor-pointer self-start md:self-auto"
              id="clear-category-filter"
            >
              Limpar Filtro ×
            </button>
          )}
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          
          {/* "All" Category Option */}
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 hover:-translate-y-0.5 shadow-xs cursor-pointer ${
              selectedCategory === null
                ? "bg-stone-900 border-stone-900 text-white shadow-md shadow-stone-900/10"
                : "bg-white border-stone-200 text-stone-700 hover:border-stone-300"
            }`}
            id="category-item-all"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-3 ${
              selectedCategory === null ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-500"
            }`}>
              <Grid className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">Ver Todos</span>
          </button>

          {/* Individual Category Cards */}
          {CATEGORIES.map((cat: Category) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 hover:-translate-y-0.5 shadow-xs cursor-pointer ${
                  isSelected
                    ? "bg-stone-900 border-stone-900 text-white shadow-md shadow-stone-900/10"
                    : "bg-white border-stone-200 text-stone-700 hover:border-stone-300"
                }`}
                id={`category-item-${cat.slug}`}
              >
                {/* Icon Container */}
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-3 transition-colors ${
                  isSelected 
                    ? "bg-stone-800 text-white" 
                    : cat.color.split(" ")[0] + " " + cat.color.split(" ")[1]
                }`}>
                  <CategoryIcon name={cat.icon} size={24} />
                </div>

                {/* Category Title */}
                <span className="text-xs font-semibold leading-tight text-center truncate w-full">
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
