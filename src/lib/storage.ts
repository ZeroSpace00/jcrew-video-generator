import type { Product } from "./types";

const STORAGE_KEY = "jcrew-video-products";

export function getSavedProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProduct(product: Product): void {
  const existing = getSavedProducts();
  const updated = existing.filter((p) => p.id !== product.id);
  updated.unshift(product);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeProduct(id: string): void {
  const existing = getSavedProducts();
  const updated = existing.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearProducts(): void {
  localStorage.removeItem(STORAGE_KEY);
}
