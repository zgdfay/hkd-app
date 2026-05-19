/**
 * Server-side API proxy for Expo Push Notifications.
 * Avoids CORS issues when sending push notifications from the web browser.
 * The browser calls this local endpoint, then the server forwards to Expo Push API.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    return Response.json(result, { status: response.status });
  } catch (error) {
    console.error('[send-push API] Failed to proxy push notification:', error);
    return Response.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}
