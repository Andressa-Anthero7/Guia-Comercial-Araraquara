import { useEffect, useSyncExternalStore } from "react";
import { Category } from "./types";
import { request } from "./api";

let categories: Category[] = [];
let pending: Promise<boolean> | undefined;
let loaded = false;
const listeners = new Set<() => void>();
export function refreshCategories() {
  if (pending) return pending;
  pending = request<Category[]>("/api/categories/", { signal: AbortSignal.timeout(15000) })
    .then((items) => {
      if (!Array.isArray(items))
        throw new Error("Resposta de categorias inválida.");
      categories = items;
      loaded = true;
      listeners.forEach((listener) => listener());
      return true;
    })
    .catch(() => {
      categories = [];
      loaded = false;
      listeners.forEach((listener) => listener());
      return false;
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
