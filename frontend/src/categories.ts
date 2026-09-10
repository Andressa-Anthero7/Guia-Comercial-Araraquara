import { useEffect, useSyncExternalStore } from "react";
import { CATEGORIES } from "./data";
import { Category } from "./types";
import { request } from "./api";

let categories = CATEGORIES;
let pending: Promise<void> | undefined;
let loaded = false;
const listeners = new Set<() => void>();
export function refreshCategories() {
  if (pending) return pending;
  pending = request<Category[]>("/api/categories/")
    .then((items) => {
      if (!Array.isArray(items))
        throw new Error("Resposta de categorias inválida.");
      categories = items;
      loaded = true;
      listeners.forEach((listener) => listener());
    })
    .catch(() => {
      /* Keep the last known catalog during a network failure. */
    })
    .finally(() => {
      pending = undefined;
    });
  return pending;
}
export function useCategories() {
  useEffect(() => {
    if (!loaded) void refreshCategories();
  }, []);
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => categories,
  );
}
