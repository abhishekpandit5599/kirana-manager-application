import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem("kirana_token"),
  setToken: (token) => {
    if (token) {
      localStorage.setItem("kirana_token", token);
    } else {
      localStorage.removeItem("kirana_token");
    }
    set({ token });
  },
  logout: () => {
    localStorage.removeItem("kirana_token");
    set({ token: null });
  },
}));
