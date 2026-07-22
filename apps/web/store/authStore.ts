import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types";
import { useMasterStore } from "./masterStore";
import { usePermissionStore } from "./permissionStore";

type AuthState = {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => {
        usePermissionStore.getState().clearPermissions();
        useMasterStore.getState().clearMaster();
        set({ user: null, token: null });
      },
    }),
    { name: "loop-auth" },
  ),
);
