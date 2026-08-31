export function getProductPurchaseUrl(status: "available" | "upcoming", messengerUrl?: string | null) {
  if (status !== "available") return null;
  return messengerUrl || "https://m.me/";
}

export function filterProductsByCategory<T extends { categoryId: number | null }>(products: T[], categoryId: number | "all") {
  return categoryId === "all" ? products : products.filter(product => product.categoryId === categoryId);
}

export function filterCollectionProducts<T extends { categoryId: number | null; status: "available" | "upcoming" }>(products: T[], filter: number | "all" | "upcoming") {
  if (filter === "upcoming") return products.filter(product => product.status === "upcoming");
  return filterProductsByCategory(products.filter(product => product.status === "available"), filter);
}
