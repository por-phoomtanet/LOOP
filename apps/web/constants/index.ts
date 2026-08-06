export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001/api";

// uploaded files (product photos, id cards, ...) are served from the API's origin
// at /uploads, separate from the /api-prefixed JSON routes
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const ROUTES = {
  home: "/",
  shop: "/shop",
  login: "/login",
  signup: "/signup",
  // ลิงก์ "ลงประกาศให้เช่า" ทั่วเว็บ (Header/Footer/หน้าแรก) ชี้มาแท็บสร้างประกาศใน
  // /my-listings เลย (ฟอร์มลงประกาศย้ายมาอยู่ inline ในแท็บแล้ว ไม่ใช่หน้าแยก /list-item อีกต่อไป)
  listItem: "/my-listings?tab=create",
  myListings: "/my-listings",
  myRentals: "/my-rentals",
  paymentProfile: "/payment-profile",
  admin: "/dashboard",
  adminUsers: "/users",
} as const;

export const CANCEL_WINDOW_MINUTES = 10;
export const DEPOSIT_MULTIPLIER = 2;
