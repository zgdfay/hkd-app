import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePushToken } from '@/services/notifications';
import { getCurrentUser } from '@/services/auth';

const PUSH_TOKEN_KEY = 'hkd_push_token';
const COMPLAINT_CODES_KEY = 'hkd_complaint_codes';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16A34A',
    });
  }

  return true;
}

/**
 * Register for push notifications.
 * Works for both logged-in users (admin/lurah) and anonymous warga.
 * - Always saves token to AsyncStorage for local access.
 * - If user is logged in, also saves to push_tokens table in Supabase.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    if (Platform.OS === 'web') {
      console.log('Push notifications are not configured for web. Skipping.');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    // Always save locally (works for warga tanpa login)
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);

    // If user is logged in, also save to server
    try {
      const user = await getCurrentUser();
      if (user) {
        await savePushToken(user.id, token, {
          platform: Platform.OS,
          appVersion: Constants.expoConfig?.version,
        });
      }
    } catch (e) {
      // silent fail
    }

    return token;
  } catch (error) {
    const errorStr = String(error);
    if (errorStr.includes('FIS_AUTH') || errorStr.includes('Fetching the token failed')) {
      console.warn(
        '⚠️ Push notifications disabled: Missing native Firebase configuration (google-services.json). ' +
          'To fix this, rebuild your dev client by running: npx expo run:android'
      );
    } else {
      console.error('Error registering for push notifications:', error);
    }
    return null;
  }
}

/**
 * Get the locally stored push token (for anonymous warga).
 */
export async function getLocalPushToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Save a complaint code locally so warga can track it later.
 */
export async function saveLocalComplaintCode(code: string): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(COMPLAINT_CODES_KEY);
    const codes: string[] = existing ? JSON.parse(existing) : [];
    if (!codes.includes(code)) {
      codes.push(code);
      await AsyncStorage.setItem(COMPLAINT_CODES_KEY, JSON.stringify(codes));
    }
  } catch (e) {
    console.error('Error saving complaint code locally:', e);
  }
}

/**
 * Get all locally saved complaint codes.
 */
export async function getLocalComplaintCodes(): Promise<string[]> {
  try {
    const existing = await AsyncStorage.getItem(COMPLAINT_CODES_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch {
    return [];
  }
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(handler);
}

export function addNotificationResponseReceivedListener(
  handler: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // immediate
    });

    return id;
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    return null;
  }
}

/**
 * Resets the application icon badge count to 0.
 * This clears the home screen notification dot/badge.
 */
export async function clearBadgeCount(): Promise<void> {
  try {
    if (Platform.OS !== 'web') {
      await Notifications.setBadgeCountAsync(0);
      console.log('[PUSH] ✅ Badge count cleared successfully');
    }
  } catch (error) {
    console.log('[PUSH] ⚠️ Failed to clear badge count:', error);
  }
}