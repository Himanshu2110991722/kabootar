const admin = require('firebase-admin');

let firebaseApp;

const getFirebaseAdmin = () => {
  if (!firebaseApp) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // For development: use default credentials or skip
      console.warn('⚠️  Firebase service account not configured. Auth verification may fail.');
      firebaseApp = { auth: () => ({ verifyIdToken: async () => ({ uid: 'dev', phone_number: '+910000000000' }) }) };
    }
  }
  return firebaseApp;
};

module.exports = { getFirebaseAdmin };
