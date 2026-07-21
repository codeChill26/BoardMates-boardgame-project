import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const dummyStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
};

// để cho tương lai
export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null, // Chứa { email, token, ... }

            setUser: (userData) => set({ user: userData }),

            logout: () => set({ user: null }),

            isAuthenticated: () => !!get().user?.token,
        }),
        {
            name: 'boardmates-auth-storage',
            storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : dummyStorage)),
        }
    )
);
