export type AccountType = "INDIVIDUAL" | "SHOP";

export type RegisterInput = {
  accountType: AccountType;
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type RegisterResult = {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    accountType: AccountType;
  };
};

export type OcrMockResult = {
  name: string;
  idNumber: string;
  dob: string;
  expiry: string;
};
