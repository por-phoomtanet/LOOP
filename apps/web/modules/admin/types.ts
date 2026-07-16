export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  accountType: "INDIVIDUAL" | "SHOP";
  verificationStatus: VerificationStatus;
  createdAt: string;
};
