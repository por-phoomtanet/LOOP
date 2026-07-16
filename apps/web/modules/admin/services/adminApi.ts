import { api } from "@/shared/services/api";
import type { ApiResponse } from "@/types";
import type { AdminUser, VerificationStatus } from "../types";

export const adminApi = {
  getUsers() {
    return api.get<ApiResponse<AdminUser[]>>("/admin/users");
  },

  updateUserStatus(id: number, status: VerificationStatus) {
    return api.patch<ApiResponse<{ id: number; verificationStatus: VerificationStatus }>>(
      `/admin/users/${id}/status`,
      { status },
    );
  },
};
