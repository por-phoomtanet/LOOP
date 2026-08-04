export type RentalStatus = "PENDING_PAYMENT" | "PAID" | "REJECTED";

export type RentalCreateInput = {
  startDate: string;
  endDate: string;
};

export type RentalCreateResult = {
  id: number;
  totalAmount: string;
  status: RentalStatus;
};

export type PaymentInfo = {
  id: number;
  productTitle: string;
  totalAmount: string;
  status: RentalStatus;
  ownerName: string;
  promptPayQrUrl: string | null;
};

export type SlipSubmitResult = {
  verified: boolean;
  reason: string | null;
};
