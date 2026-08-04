import { api } from "@/shared/services/api";
import type { ApiResponse } from "@/types";
import type {
  PaymentInfo,
  RentalCreateInput,
  RentalCreateResult,
  SlipSubmitResult,
} from "../types";

export const rentalsApi = {
  createRental(productId: number, input: RentalCreateInput) {
    return api.post<ApiResponse<RentalCreateResult>>(`/products/${productId}/rentals`, input);
  },

  getPaymentInfo(rentalId: number) {
    return api.get<ApiResponse<PaymentInfo>>(`/rentals/${rentalId}/payment`);
  },

  submitSlip(rentalId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    return api.post<ApiResponse<SlipSubmitResult>>(`/rentals/${rentalId}/slip`, form);
  },
};
