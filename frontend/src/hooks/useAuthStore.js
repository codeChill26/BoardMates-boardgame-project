import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// 2 tiếng không hoạt động = 2 * 60 * 60 * 1000 = 7,200,000 ms
export const SESSION_INACTIVITY_LIMIT = 2 * 60 * 60 * 1000;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null, // Chứa { id, email, name, avatar, token, role, ... }
      lastActivity: null, // Lưu timestamp lần tương tác gần nhất

      // Thiết lập thông tin người dùng và khởi tạo mốc thời gian hoạt động
      setUser: (userData) => {
        set({
          user: userData,
          lastActivity: Date.now(),
        });
      },

      // Cập nhật timestamp khi người dùng có tương tác mới
      updateActivity: () => {
        if (get().user?.token) {
          set({ lastActivity: Date.now() });
        }
      },

      // Đăng xuất và xóa phiên
      logout: () => {
        set({
          user: null,
          lastActivity: null,
        });
      },

      // Kiểm tra phiên đăng nhập đã quá 2 tiếng không tương tác chưa
      isSessionExpired: () => {
        const { user, lastActivity } = get();
        if (!user || !user.token) return false;
        if (!lastActivity) return true;
        return Date.now() - lastActivity > SESSION_INACTIVITY_LIMIT;
      },

      // Kiểm tra trạng thái đã đăng nhập và phiên còn hiệu lực
      isAuthenticated: () => {
        const { user, lastActivity, isSessionExpired } = get();
        if (!user?.token) return false;
        if (isSessionExpired()) {
          // Tự động dọn dẹp nếu đã hết hạn
          get().logout();
          return false;
        }
        return true;
      },
    }),
    {
      name: 'boardmates-auth-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : dummyStorage
      ),
    }
  )
);
