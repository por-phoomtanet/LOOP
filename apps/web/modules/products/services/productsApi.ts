import { api } from "@/shared/services/api";
import type { ApiResponse } from "@/types";
import type { Category, CreateListingInput, Product, ProductImage } from "../types";

export const productsApi = {
  getCategories() {
    return api.get<ApiResponse<Category[]>>("/categories");
  },

  createListing(input: CreateListingInput) {
    return api.post<ApiResponse<Product>>("/products", input);
  },

  uploadImages(productId: number, files: File[]) {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return api.post<ApiResponse<ProductImage[]>>(`/products/${productId}/images`, form);
  },
};
