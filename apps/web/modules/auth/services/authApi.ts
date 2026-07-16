import { api } from "@/shared/services/api";
import type { ApiResponse, User } from "@/types";
import type { RegisterInput, RegisterResult } from "../types";

export const authApi = {
  login(email: string, password: string) {
    return api.post<ApiResponse<{ token: string; user: User }>>("/auth/login", {
      email,
      password,
    });
  },

  register(input: RegisterInput) {
    return api.post<ApiResponse<RegisterResult>>("/auth/register", input);
  },

  requestOtp(method: "email" | "phone") {
    return api.post<ApiResponse<{ method: string; destination: string }>>(
      "/auth/register/otp/request",
      { method },
    );
  },

  verifyOtp(code: string) {
    return api.post<ApiResponse<{ verified: boolean }>>("/auth/register/otp/verify", { code });
  },

  uploadIdCard(userId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    return api.post<ApiResponse<{ idCardImageUrl: string }>>(`/users/${userId}/id-card`, form);
  },

  faceVerify(userId: number) {
    return api.post<ApiResponse<{ faceVerified: boolean }>>(`/users/${userId}/face-verify`, {});
  },

  getRolePermissions(role: string) {
    return api.get<
      ApiResponse<
        {
          menuKey: string;
          canView: boolean;
          canCreate: boolean;
          canUpdate: boolean;
          canDelete: boolean;
        }[]
      >
    >(`/role-permissions/${role}`);
  },
};
