import LoadingScreen from '@/components/shared/LoadingScreen';
import '@/global.css';
import Toast from 'react-native-toast-message';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  clearBadgeCount,
} from '@/services/push-notifications';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const [loaded, error] = useFonts({
    'Poppins-Black': require('../assets/font/Poppins/Poppins-Black.woff2'),
    'Poppins-Bold': require('../assets/font/Poppins/Poppins-Bold.woff2'),
    'Poppins-ExtraBold': require('../assets/font/Poppins/Poppins-ExtraBold.woff2'),
    'Poppins-ExtraLight': require('../assets/font/Poppins/Poppins-ExtraLight.woff2'),
    'Poppins-Light': require('../assets/font/Poppins/Poppins-Light.woff2'),
    'Poppins-Medium': require('../assets/font/Poppins/Poppins-Medium.woff2'),
    'Poppins-Regular': require('../assets/font/Poppins/Poppins-Regular.woff2'),
    'Poppins-SemiBold': require('../assets/font/Poppins/Poppins-SemiBold.woff2'),
    'Poppins-Thin': require('../assets/font/Poppins/Poppins-Thin.woff2'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Register push notifications globally and manage badge count
  useEffect(() => {
    // Clear badge count immediately on startup
    clearBadgeCount();

    registerForPushNotificationsAsync().catch((e) =>
      console.log('Push notification registration error:', e)
    );

    // Listen for incoming notifications while app is in foreground
    const receivedSub = addNotificationReceivedListener((notification) => {
      console.log('🔔 [FOREGROUND PUSH RECEIVED]:', notification.request.content.title, notification.request.content.body);
      console.log('📦 Data Payload:', JSON.stringify(notification.request.content.data));
      // Optional: you can choose not to clear badge if you want to keep it while in foreground,
      // but usually when the app is active/foregrounded, we want the badge to stay 0.
      clearBadgeCount();
    });

    // Handle notification tap (app opened from notification)
    const responseSub = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('👆 [PUSH TAPPED]:', response.notification.request.content.title);
      console.log('📦 Data Tapped:', JSON.stringify(data));
      
      clearBadgeCount(); // Clear badge when tapping notification
      if (data?.type === 'new_complaint' || data?.type === 'lurah_processing' || data?.type === 'lurah_done') {
        router.push('/admin/dashboard' as any);
      } else if (data?.type === 'new_task') {
        router.push('/lurah/dashboard' as any);
      } else if (data?.type === 'status_update' || data?.type === 'complaint_completed') {
        router.push('/lacak-pengaduan' as any);
      }
    });

    // Handle AppState changes (clear badge count when app returns to foreground)
    const appStateSub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[PUSH] App came to foreground, clearing badge');
        clearBadgeCount();
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
      appStateSub.remove();
    };
  }, []);

  if (!loaded && !error) {
    return <LoadingScreen />;
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack />
      <PortalHost />
      <Toast />
    </ThemeProvider>
  );
}
