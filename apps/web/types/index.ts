export type ApiResponse<T> = {
  data: T;
  message: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  message: string;
  total: number;
  page: number;
  pageSize: number;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  accountType: "INDIVIDUAL" | "SHOP";
};
