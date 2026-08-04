export type AccountType = "INDIVIDUAL" | "SHOP";

export type RegisterInput = {
  accountType: AccountType;
  name: string;
  email: string;
  phone: string;
  password: string;
  pdpaConsent: true;
  idCardNumber?: string;
  idCardNameTh?: string;
  idCardNameEn?: string;
  idCardAddress?: string;
  idCardDob?: string;
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

export type IdCardOcrResult = {
  idNumber: string | null;
  nameTh: string | null;
  nameEn: string | null;
  address: string | null;
  dob: string | null;
  valid: boolean;
};
