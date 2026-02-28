import { create } from "zustand"

interface AuthState {
  isOnboarded: boolean
  userName: string
  userField: string
  setOnboarded: (name: string, field: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isOnboarded: false,
  userName: "",
  userField: "",
  setOnboarded: (name, field) =>
    set({ isOnboarded: true, userName: name, userField: field }),
  logout: () =>
    set({ isOnboarded: false, userName: "", userField: "" }),
}))
