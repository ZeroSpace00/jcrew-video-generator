import type { Product } from "./types";
import { SEED_PRODUCTS } from "./seed-products";

const STORAGE_KEY = "jcrew-video-products";

export function getSavedProducts(): Product[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // Seed localStorage with default products on first load
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PRODUCTS));
    return [...SEED_PRODUCTS];
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

export function saveAllProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function removeProduct(id: string): void {
  const existing = getSavedProducts();
  const updated = existing.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearProducts(): void {
  localStorage.removeItem(STORAGE_KEY);
}
