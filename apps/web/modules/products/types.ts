export type ProductStatus = "UNDER_REVIEW" | "ACTIVE" | "PAUSED";

export type Category = {
  id: number;
  name: string;
  slug: string;
  imageUrl?: string | null;
  productCount?: number;
};

export type ProductImage = {
  id: number;
  url: string;
  sortOrder: number;
};

export type PickupMethod = "MEETUP" | "GRAB" | "POST";

export type PickupOption = {
  id: number;
  type: PickupMethod;
  label: string;
};

export type PriceTier = {
  days: number;
  price: string;
};

export type MyListing = {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  pricePerDay: string;
  priceTiers: PriceTier[];
  location: string;
  lat: number | null;
  lng: number | null;
  status: ProductStatus;
  ratingAvg: number;
  reviewCount: number;
  images: ProductImage[];
  pickupOptions: PickupOption[];
  createdAt: string;
};

export type ProductInput = {
  title: string;
  description: string;
  categoryId: number;
  pricePerDay: number;
  priceTiers?: { days: number; price: number }[];
  location: string;
  lat?: number;
  lng?: number;
};

export type ProductCardData = {
  id: number;
  title: string;
  categoryName: string;
  categorySlug: string;
  ownerName: string;
  pricePerDay: string;
  priceTiers: PriceTier[];
  location: string;
  ratingAvg: number;
  reviewCount: number;
  thumbnailUrl: string | null;
};

export type ProductDetail = {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  ownerName: string;
  pricePerDay: string;
  priceTiers: PriceTier[];
  location: string;
  lat: number | null;
  lng: number | null;
  ratingAvg: number;
  reviewCount: number;
  images: string[];
  pickupOptions: { type: PickupMethod; label: string }[];
  similar: ProductCardData[];
};

export type SavedLocation = {
  id: number;
  label: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
};
