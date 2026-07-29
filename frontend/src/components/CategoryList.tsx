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
    <section className="border-b border-stone-200 bg-stone-50/80">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-bold transition ${
              selectedCategory === null
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
            }`}
            id="category-item-all"
          >
            <Grid className="h-4 w-4" />
            <span>Todos</span>
          </button>

          {CATEGORIES.map((category: Category) => {
            const isSelected = selectedCategory === category.slug;
            return (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-bold transition ${
                  isSelected
                    ? "border-stone-900 bg-stone-900 text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
                id={`category-item-${category.slug}`}
              >
                <CategoryIcon name={category.icon} size={16} />
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
