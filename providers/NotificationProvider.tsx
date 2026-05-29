import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { getCurrentUser } from '@/services/auth';
import Toast from 'react-native-toast-message';
import { getLocalPushToken } from '@/services/push-notifications';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationContextType {
  /** Timestamp that increments on data changes — use to trigger refetch */
  lastUpdateTimestamp: number;
  /** The device's Expo Push Token (null if unavailable) */
  expoPushToken: string | null;
}

const NotificationContext = createContext<NotificationContextType>({
  lastUpdateTimestamp: 0,
  expoPushToken: null,
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const router = useRouter();

  // 1. Setup push token and listeners
  useEffect(() => {
    // Register push token for logged-in users
    setupPushToken();

    // Listener: notification received while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body } = notification.request.content;

        // Show in-app toast for foreground notifications
        Toast.show({
          type: 'success',
          text1: title || 'Notifikasi',
          text2: body || '',
          position: 'top',
          visibilityTime: 4000,
          topOffset: 50,
        });
      }
    );

    // Listener: user tapped on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;

        // Navigate based on notification data
        if (data?.screen) {
          try {
            router.push(data.screen as any);
          } catch {
            // Silently fail if route is invalid
          }
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // 2. Supabase Realtime for live dashboard refresh (admin/lurah only)
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const user = await getCurrentUser();
      if (!user) return; // Only logged-in users get realtime UI updates

      channel = supabase
        .channel('complaints-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'complaints' },
          (_payload) => {
            // Trigger UI refresh in dashboards
            setLastUpdateTimestamp(Date.now());
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  /**
   * Get Expo Push Token from local storage and expose to context if needed.
   * Registration is handled centrally in app/_layout.tsx and app/login.tsx
   */
  const setupPushToken = async () => {
    try {
      const token = await getLocalPushToken();

      if (token) {
        console.log('🔑 [DEBUG] Expo Push Token loaded from local storage:', token);
        setExpoPushToken(token);
      }
    } catch (error) {
      console.error('Failed to setup push token state:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ lastUpdateTimestamp, expoPushToken }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
