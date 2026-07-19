import { api } from "@/shared/services/api";
import type { ApiResponse } from "@/types";
import type { AdminUser, DashboardStats, Role, RolePermission, VerificationStatus } from "../types";

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

  getDashboard() {
    return api.get<ApiResponse<DashboardStats>>("/admin/dashboard");
  },

  getRoles() {
    return api.get<ApiResponse<Role[]>>("/roles");
  },

  createRole(input: { name: string; label: string }) {
    return api.post<ApiResponse<Role>>("/roles", input);
  },

  updateRole(id: number, input: { name?: string; label?: string }) {
    return api.put<ApiResponse<Role>>(`/roles/${id}`, input);
  },

  deleteRole(id: number) {
    return api.delete<ApiResponse<null>>(`/roles/${id}`);
  },

  getRolePermissions(roleName: string) {
    return api.get<ApiResponse<RolePermission[]>>(`/role-permissions/${roleName}`);
  },

  updateRolePermission(roleName: string, menuKey: string, data: Omit<RolePermission, "menuKey">) {
    return api.put<ApiResponse<RolePermission>>(`/role-permissions/${roleName}/${menuKey}`, data);
  },
};
