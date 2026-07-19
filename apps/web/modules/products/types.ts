export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type CreateListingInput = {
  title: string;
  description: string;
  categoryId: number;
  pricePerDay: number;
  pickupOptions: string[];
};

export type ProductImage = {
  id: number;
  url: string;
  sortOrder: number;
};

export type Product = {
  id: number;
  title: string;
  description: string;
  location: string;
  pricePerDay: string;
  status: "UNDER_REVIEW" | "ACTIVE" | "PAUSED";
  category: Category;
  images: ProductImage[];
  pickupOptions: { id: number; label: string }[];
};
