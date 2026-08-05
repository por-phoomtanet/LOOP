import { api } from "@/shared/services/api";
import type { ApiResponse, User } from "@/types";
import type { IdCardOcrResult, RegisterInput, RegisterResult } from "../types";

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

  ocrIdCard(file: File) {
    const form = new FormData();
    form.append("file", file);
    // endpoint public — ไม่ต้องมี token, รันได้ก่อนสร้างบัญชี (ดู Dev Standard #24)
    return api.post<ApiResponse<IdCardOcrResult>>("/ocr/id-card", form);
  },

  requestSignupOtp(email: string) {
    // endpoint public — ยืนยันอีเมลก่อนสร้างบัญชี ยังไม่มี user/token ให้ auth
    return api.post<ApiResponse<{ destination: string }>>("/auth/signup-otp/request", { email });
  },

  verifySignupOtp(email: string, code: string) {
    return api.post<ApiResponse<{ verified: boolean }>>("/auth/signup-otp/verify", {
      email,
      code,
    });
  },

  requestOtp() {
    return api.post<ApiResponse<{ method: string; destination: string }>>(
      "/auth/register/otp/request",
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

  updatePaymentProfile(userId: number, legalName: string) {
    return api.patch<ApiResponse<{ legalName: string }>>(`/users/${userId}/payment-profile`, {
      legalName,
    });
  },

  uploadPromptPayQr(userId: number, file: File) {
    const form = new FormData();
    form.append("file", file);
    return api.post<ApiResponse<{ promptPayQrUrl: string }>>(`/users/${userId}/payment-qr`, form);
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
