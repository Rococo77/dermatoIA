import { create } from 'zustand';
import { Notification } from '../types';
import apiClient from '../api/client';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  totalItems: number;
  isLoading: boolean;

  fetchNotifications: (page?: number) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  totalItems: 0,
  isLoading: false,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/notifications/', { params: { page, limit: 20 } });
      const data = response.data;
      const unread = data.items.filter((n: Notification) => !n.is_read).length;
      set({
        notifications: data.items,
        totalItems: data.total,
        unreadCount: unread,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // Silent fail
    }
  },

  markAllAsRead: async () => {
    try {
      await apiClient.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch {
      // Silent fail
    }
  },
}));
