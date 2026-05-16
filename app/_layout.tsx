import LoadingScreen from '@/components/shared/LoadingScreen';
import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
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
