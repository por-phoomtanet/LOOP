export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001/api";

// uploaded files (product photos, id cards, ...) are served from the API's origin
// at /uploads, separate from the /api-prefixed JSON routes
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export const ROUTES = {
  home: "/",
  shop: "/shop",
  login: "/login",
  signup: "/signup",
  listItem: "/list-item",
  myListings: "/my-listings",
  myRentals: "/my-rentals",
  admin: "/dashboard",
  adminUsers: "/users",
} as const;

export const CANCEL_WINDOW_MINUTES = 10;
export const DEPOSIT_MULTIPLIER = 2;
