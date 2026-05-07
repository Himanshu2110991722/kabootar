const admin = require('firebase-admin');
const User  = require('../models/User');

/**
 * Send a push notification to a user by their MongoDB _id.
 * Silently does nothing if the user has no FCM token or Firebase isn't initialised.
 */
async function sendPush(userId, { title, body, data = {} }) {
  if (!userId) return;
  try {
    // Firebase Admin must be initialised (done lazily in auth.js on first request)
    if (!admin.apps.length) return;

    const user = await User.findById(userId).select('fcmToken name');
    if (!user?.fcmToken) return;

    await admin.messaging().send({
      token: user.fcmToken,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: { sound: 'default', channel_id: 'kabutar_default' },
      },
      webpush: {
        notification: { icon: '/logo.png', badge: '/logo.png', vibrate: [200, 100, 200] },
        fcm_options: { link: 'https://app.kabutar.in' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    });
  } catch (err) {
    // Token invalid or expired — clear it so we stop retrying
    if (
      err.code === 'messaging/registration-token-not-registered' ||
      err.code === 'messaging/invalid-registration-token'
    ) {
      await User.findByIdAndUpdate(userId, { fcmToken: '' }).catch(() => {});
    }
    // Do not throw — push failures must never break the main request
  }
}

module.exports = { sendPush };
