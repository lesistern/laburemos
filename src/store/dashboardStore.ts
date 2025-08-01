import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { 
  DashboardStore, 
  DashboardData, 
  DashboardStats, 
  Notification,
  Activity,
  ChartData
} from '../components/Dashboard/types';

// API service for dashboard data
class DashboardApiService {
  private baseUrl = '/api/dashboard';

  async fetchDashboardData(userId: string): Promise<DashboardData> {
    const response = await fetch(`${this.baseUrl}/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch dashboard data');
    }

    return result.data;
  }

  async updateStats(userId: string, stats: Partial<DashboardStats>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${userId}/stats`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(stats),
    });

    if (!response.ok) {
      throw new Error(`Failed to update stats: ${response.statusText}`);
    }
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to mark notification as read: ${response.statusText}`);
    }
  }
}

const apiService = new DashboardApiService();

// Initial state
const initialState = {
  data: null,
  loading: false,
  error: null,
  notifications: [],
  filters: {
    timeRange: '30d' as const,
    activityTypes: [],
    notificationCategories: [],
  },
  preferences: {
    theme: 'auto' as const,
    autoRefresh: true,
    refreshInterval: 30000,
    compactMode: false,
    soundEnabled: true,
  },
};

// Create the store with multiple middleware
export const useDashboardStore = create<DashboardStore>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          // Fetch dashboard data
          fetchDashboardData: async (userId: string) => {
            set((state) => {
              state.loading = true;
              state.error = null;
            });

            try {
              const data = await apiService.fetchDashboardData(userId);
              
              set((state) => {
                state.data = data;
                state.loading = false;
                state.notifications = data.notifications || [];
              });
            } catch (error) {
              set((state) => {
                state.loading = false;
                state.error = error instanceof Error ? error.message : 'An unknown error occurred';
              });
            }
          },

          // Update stats
          updateStats: async (stats: Partial<DashboardStats>) => {
            const currentData = get().data;
            if (!currentData) return;

            // Optimistic update
            set((state) => {
              if (state.data?.stats) {
                state.data.stats = { ...state.data.stats, ...stats };
              }
            });

            try {
              await apiService.updateStats(currentData.user.id, stats);
            } catch (error) {
              // Revert optimistic update on error
              set((state) => {
                if (state.data?.stats) {
                  // Revert the changes
                  Object.keys(stats).forEach((key) => {
                    delete state.data!.stats[key as keyof DashboardStats];
                  });
                }
                state.error = error instanceof Error ? error.message : 'Failed to update stats';
              });
            }
          },

          // Add notification
          addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
            set((state) => {
              const newNotification: Notification = {
                ...notification,
                id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString(),
              };
              
              state.notifications.unshift(newNotification);
              
              // Keep only the latest 50 notifications
              if (state.notifications.length > 50) {
                state.notifications = state.notifications.slice(0, 50);
              }
            });

            // Play sound if enabled
            const { soundEnabled } = get().preferences;
            if (soundEnabled && 'Audio' in window) {
              try {
                const audio = new Audio('/assets/sounds/notification.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => {
                  // Ignore audio play errors (user hasn't interacted with page yet)
                });
              } catch (error) {
                // Ignore audio creation errors
              }
            }
          },

          // Mark notification as read
          markNotificationRead: async (id: string) => {
            // Optimistic update
            set((state) => {
              const notification = state.notifications.find(n => n.id === id);
              if (notification) {
                notification.read = true;
              }
            });

            try {
              await apiService.markNotificationRead(id);
            } catch (error) {
              // Revert optimistic update on error
              set((state) => {
                const notification = state.notifications.find(n => n.id === id);
                if (notification) {
                  notification.read = false;
                }
                state.error = error instanceof Error ? error.message : 'Failed to mark notification as read';
              });
            }
          },

          // Mark all notifications as read
          markAllNotificationsRead: async () => {
            const unreadNotifications = get().notifications.filter(n => !n.read);
            
            // Optimistic update
            set((state) => {
              state.notifications.forEach(notification => {
                notification.read = true;
              });
            });

            try {
              // Mark all unread notifications as read
              await Promise.all(
                unreadNotifications.map(notification => 
                  apiService.markNotificationRead(notification.id)
                )
              );
            } catch (error) {
              // Revert optimistic update on error
              set((state) => {
                unreadNotifications.forEach(notification => {
                  const stateNotification = state.notifications.find(n => n.id === notification.id);
                  if (stateNotification) {
                    stateNotification.read = false;
                  }
                });
                state.error = error instanceof Error ? error.message : 'Failed to mark all notifications as read';
              });
            }
          },

          // Remove notification
          removeNotification: (id: string) => {
            set((state) => {
              state.notifications = state.notifications.filter(n => n.id !== id);
            });
          },

          // Set time range filter
          setTimeRange: (range: ChartData['timeRange']) => {
            set((state) => {
              state.filters.timeRange = range;
            });

            // Refetch data with new time range
            const currentData = get().data;
            if (currentData) {
              get().fetchDashboardData(currentData.user.id);
            }
          },

          // Set activity filter
          setActivityFilter: (types: Activity['type'][]) => {
            set((state) => {
              state.filters.activityTypes = types;
            });
          },

          // Set notification filter
          setNotificationFilter: (categories: Notification['category'][]) => {
            set((state) => {
              state.filters.notificationCategories = categories;
            });
          },

          // Update preferences
          updatePreferences: (preferences: Partial<typeof initialState.preferences>) => {
            set((state) => {
              state.preferences = { ...state.preferences, ...preferences };
            });
          },

          // Clear error
          clearError: () => {
            set((state) => {
              state.error = null;
            });
          },

          // Reset store
          reset: () => {
            set(() => ({ ...initialState }));
          },
        }))
      ),
      {
        name: 'dashboard-store',
        partialize: (state) => ({
          preferences: state.preferences,
          filters: state.filters,
        }),
      }
    ),
    {
      name: 'dashboard-store',
    }
  )
);

// Selectors for better performance
export const useDashboardData = () => useDashboardStore((state) => state.data);
export const useDashboardLoading = () => useDashboardStore((state) => state.loading);
export const useDashboardError = () => useDashboardStore((state) => state.error);
export const useDashboardNotifications = () => useDashboardStore((state) => state.notifications);
export const useDashboardStats = () => useDashboardStore((state) => state.data?.stats);
export const useDashboardCharts = () => useDashboardStore((state) => state.data?.charts);
export const useDashboardActivities = () => useDashboardStore((state) => state.data?.recentActivity);
export const useDashboardPreferences = () => useDashboardStore((state) => state.preferences);
export const useDashboardFilters = () => useDashboardStore((state) => state.filters);

// Subscribe to notifications for real-time updates
export const subscribeToNotifications = (callback: (notifications: Notification[]) => void) => {
  return useDashboardStore.subscribe(
    (state) => state.notifications,
    callback
  );
};

// Subscribe to data changes
export const subscribeToDashboardData = (callback: (data: DashboardData | null) => void) => {
  return useDashboardStore.subscribe(
    (state) => state.data,
    callback
  );
};

// Helper function to get unread notification count
export const getUnreadNotificationCount = () => {
  const notifications = useDashboardStore.getState().notifications;
  return notifications.filter(n => !n.read).length;
};

// Helper function to get filtered activities
export const getFilteredActivities = () => {
  const { data, filters } = useDashboardStore.getState();
  if (!data?.recentActivity) return [];

  const { activityTypes } = filters;
  if (activityTypes.length === 0) return data.recentActivity;

  return data.recentActivity.filter(activity => 
    activityTypes.includes(activity.type)
  );
};

// Helper function to get filtered notifications
export const getFilteredNotifications = () => {
  const { notifications, filters } = useDashboardStore.getState();
  const { notificationCategories } = filters;
  
  if (notificationCategories.length === 0) return notifications;

  return notifications.filter(notification => 
    notificationCategories.includes(notification.category)
  );
};