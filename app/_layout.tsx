import LoadingScreen from '@/components/shared/LoadingScreen';
import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
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

  // Register push notifications globally (for all users including warga tanpa login)
  useEffect(() => {
    registerForPushNotificationsAsync().catch((e) =>
      console.log('Push notification registration error:', e)
    );

    // Listen for incoming notifications while app is in foreground
    const receivedSub = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content.title);
    });

    // Handle notification tap (app opened from notification)
    const responseSub = addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'new_complaint' || data?.type === 'lurah_processing' || data?.type === 'lurah_done') {
        router.push('/admin/dashboard' as any);
      } else if (data?.type === 'new_task') {
        router.push('/lurah/dashboard' as any);
      } else if (data?.type === 'status_update' || data?.type === 'complaint_completed') {
        router.push('/lacak-pengaduan' as any);
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
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
    </ThemeProvider>
  );
}
