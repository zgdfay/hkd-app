import { supabase } from '@/utils/supabase';
import { Platform } from 'react-native';
import { Notification } from '@/types';

export interface CreateNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// ─── In-App Notification CRUD ───────────────────────────────────────

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapToNotification);
}

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapToNotification);
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw new Error(error.message);
}

export async function createNotification(
  payload: CreateNotificationPayload
): Promise<Notification> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: payload.userId,
      title: payload.title,
      body: payload.body,
      data: payload.data || {},
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapToNotification(data);
}

// ─── Push Token Storage ─────────────────────────────────────────────

export async function savePushToken(
  userId: string,
  token: string,
  deviceInfo?: Record<string, any>
): Promise<void> {
  // 1. Remove stale entries: if another user had this same token, delete it
  //    (one device can only belong to one user at a time)
  try {
    await supabase
      .from('push_tokens')
      .delete()
      .eq('token', token)
      .neq('user_id', userId);
  } catch (e) {
    console.log('Could not clean stale push tokens:', e);
  }

  // 2. Upsert the token for the current user
  const { error } = await supabase
    .from('push_tokens')
    .upsert({
      user_id: userId,
      token,
      device_info: deviceInfo || {},
      updated_at: new Date().toISOString(),
    });

  if (error) throw new Error(error.message);
}

export async function getPushToken(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('token')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data?.token || null;
}

// ─── Push Notification Sending (via Expo Push Service) ──────────────

/**
 * Send push notifications via Supabase Edge Function → Expo Push Service.
 * Accepts an array of Expo push tokens.
 */
async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  // De-duplicate tokens to prevent duplicate notifications on the same device
  const uniqueTokens = Array.from(new Set(tokens.filter((t) => t && t.startsWith('ExponentPushToken'))));
  if (uniqueTokens.length === 0) {
    console.log('[sendPush] No valid Expo push tokens to send to');
    return;
  }

  console.log(`[sendPush] Sending to ${uniqueTokens.length} token(s): "${title}" (platform: ${Platform.OS})`);

  try {
    const messages = uniqueTokens.map((token) => ({
      to: token,
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: 'high',
    }));

    // On web, use our server-side API proxy to avoid CORS blocking.
    // On mobile (React Native), call Expo Push API directly (no CORS restrictions).
    const endpoint = Platform.OS === 'web'
      ? '/api/send-push'
      : 'https://exp.host/--/api/v2/push/send';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();
    console.log(`[sendPush] Expo API response (${response.status}):`, JSON.stringify(result));
  } catch (error) {
    console.error('[sendPush] Failed to send push notifications:', error);
  }
}

/**
 * Get push tokens for a specific role (admin or lurah).
 */
async function getTokensForRole(role: 'admin' | 'lurah'): Promise<string[]> {
  try {
    // 1. Get all profiles for the specified role
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', role);

    if (profileError) {
      console.error(`[DEBUG] Failed to get profiles for role ${role}:`, profileError);
      return [];
    }

    if (!profiles || profiles.length === 0) {
      console.log(`[DEBUG] 0 profiles found for role ${role} (Mungkin karena RLS / Anonymous)`);
      return [];
    }

    const userIds = profiles.map((p) => p.id);
    console.log(`[DEBUG] Found ${userIds.length} profiles for role ${role}`);

    // 2. Get all push tokens associated with those user IDs
    const { data: pushTokens, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token')
      .in('user_id', userIds);

    if (tokenError) {
      console.error(`[DEBUG] Failed to get push tokens for ${role}:`, tokenError);
      return [];
    }

    const rawTokens = (pushTokens || []).map((t: any) => t.token).filter(Boolean);
    const uniqueRawTokens = Array.from(new Set(rawTokens));
    console.log(`[DEBUG] Total unique push tokens found for ${role}: ${uniqueRawTokens.length}`);
    return uniqueRawTokens;
  } catch (error) {
    console.error(`Exception in getTokensForRole for ${role}:`, error);
    return [];
  }
}

// ─── Role-Based Notification Functions ──────────────────────────────

/**
 * Notify all admin users (in-app + push).
 */
export async function notifyAdmins(
  title: string,
  body: string,
  data: Record<string, any>
): Promise<void> {
  try {
    // 1. Create in-app notifications
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if (profiles && profiles.length > 0) {
      await supabase.from('notifications').insert(
        profiles.map((p) => ({
          user_id: p.id,
          title,
          body,
          data,
        }))
      );
    }

    // 2. Send push notifications
    const tokens = await getTokensForRole('admin');
    await sendPushNotifications(tokens, title, body, data);
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
}

/**
 * Notify all lurah users (in-app + push).
 */
export async function notifyLurah(
  title: string,
  body: string,
  data: Record<string, any>
): Promise<void> {
  try {
    // 1. Create in-app notifications
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'lurah');

    if (profiles && profiles.length > 0) {
      await supabase.from('notifications').insert(
        profiles.map((p) => ({
          user_id: p.id,
          title,
          body,
          data,
        }))
      );
    }

    // 2. Send push notifications
    const tokens = await getTokensForRole('lurah');
    await sendPushNotifications(tokens, title, body, data);
  } catch (error) {
    console.error('Error notifying lurah:', error);
  }
}

/**
 * Notify warga (anonymous) by complaint ID using stored reporter_push_token.
 * No in-app notification (warga has no user account), only push.
 */
export async function notifyWargaByComplaintId(
  complaintId: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const { data: complaint, error: fetchError } = await supabase
      .from('complaints')
      .select('reporter_push_token')
      .eq('id', complaintId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch complaint for warga notification:', fetchError);
      return;
    }

    if (!complaint?.reporter_push_token) {
      console.log(`Warga notification skipped: no reporter_push_token found for complaint ${complaintId}. Laporan mungkin dibuat dari Web.`);
      return;
    }

    console.log(`Sending warga notification to token: ${complaint.reporter_push_token.substring(0, 30)}...`);
    await sendPushNotifications(
      [complaint.reporter_push_token],
      title,
      body,
      { complaintId, type: 'status_update' }
    );
  } catch (error) {
    console.error('Error notifying warga:', error);
  }
}

// ─── Mappers ────────────────────────────────────────────────────────

function mapToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    body: row.body,
    data: row.data || {},
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}