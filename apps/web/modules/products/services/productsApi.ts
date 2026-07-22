import { api } from "@/shared/services/api";
import type { ApiResponse, PaginatedResponse } from "@/types";
import type {
  Category,
  MyListing,
  PickupOption,
  ProductCardData,
  ProductImage,
  ProductInput,
  SavedLocation,
} from "../types";

export const productsApi = {
  getCategories() {
    return api.get<ApiResponse<Category[]>>("/categories");
  },

  getProducts(params?: { q?: string; category?: string; page?: number; pageSize?: number }) {
    return api.get<PaginatedResponse<ProductCardData>>("/products", { params });
  },

  createProduct(input: ProductInput) {
    return api.post<ApiResponse<{ id: number }>>("/products", input);
  },

  updateProduct(id: number, input: Partial<ProductInput>) {
    return api.put<ApiResponse<{ id: number }>>(`/products/${id}`, input);
  },

  setStatus(id: number, status: "ACTIVE" | "PAUSED") {
    return api.patch<ApiResponse<{ id: number; status: string }>>(`/products/${id}/status`, {
      status,
    });
  },

  deleteProduct(id: number) {
    return api.delete<ApiResponse<null>>(`/products/${id}`);
  },

  uploadImages(id: number, files: File[]) {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return api.post<ApiResponse<ProductImage[]>>(`/products/${id}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  addPickupOption(id: number, label: string) {
    return api.post<ApiResponse<PickupOption>>(`/products/${id}/pickup-options`, { label });
  },

  removePickupOption(id: number, optionId: number) {
    return api.delete<ApiResponse<null>>(`/products/${id}/pickup-options/${optionId}`);
  },

  getMyListings() {
    return api.get<ApiResponse<MyListing[]>>("/me/listings");
  },

  getSavedLocations() {
    return api.get<ApiResponse<SavedLocation[]>>("/me/locations");
  },

  createSavedLocation(input: { label: string; address: string; lat: number; lng: number }) {
    return api.post<ApiResponse<SavedLocation>>("/me/locations", input);
  },

  deleteSavedLocation(id: number) {
    return api.delete<ApiResponse<null>>(`/me/locations/${id}`);
  },
};
