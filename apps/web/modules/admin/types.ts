export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  accountType: "INDIVIDUAL" | "SHOP";
  verificationStatus: VerificationStatus;
  createdAt: string;
};

export type DashboardStats = {
  users: { total: number; pending: number };
  products: number | null;
  orders: number | null;
  grossRentalValue: number | null;
  categories: number | null;
  activeListings: number | null;
};

export type Role = {
  id: number;
  name: string;
  label: string;
  createdAt: string;
  userCount: number;
};

export type RolePermission = {
  menuKey: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};
