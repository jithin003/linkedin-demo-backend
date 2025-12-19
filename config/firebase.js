const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

let firebaseApp = null;

const initializeFirebase = () => {
    if (firebaseApp) {
        return firebaseApp;
    }

    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
            path.join(__dirname, '../firebase-service-account.json');

        // Check if service account file exists
        const fs = require('fs');
        if (!fs.existsSync(serviceAccountPath)) {
            console.warn('⚠️  Firebase service account file not found. Push notifications will be disabled.');
            console.warn('   Please add firebase-service-account.json to enable push notifications.');
            return null;
        }

        const serviceAccount = require(serviceAccountPath);

        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });

        console.log('✅ Firebase Admin SDK initialized successfully');
        return firebaseApp;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
        console.warn('   Push notifications will be disabled.');
        return null;
    }
};

const getFirebaseApp = () => {
    if (!firebaseApp) {
        return initializeFirebase();
    }
    return firebaseApp;
};

const sendPushNotification = async (token, notification) => {
    const app = getFirebaseApp();

    if (!app) {
        console.warn('Firebase not initialized. Skipping push notification.');
        return null;
    }

    try {
        const message = {
            token: token,
            notification: {
                title: notification.title,
                body: notification.body,
            },
            data: notification.data || {},
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                    },
                },
            },
        };

        const response = await admin.messaging().send(message);
        console.log('✅ Push notification sent:', response);
        return response;
    } catch (error) {
        console.error('❌ Error sending push notification:', error);
        throw error;
    }
};

const sendMulticastNotification = async (tokens, notification) => {
    const app = getFirebaseApp();

    if (!app || !tokens || tokens.length === 0) {
        return null;
    }

    try {
        const message = {
            tokens: tokens,
            notification: {
                title: notification.title,
                body: notification.body,
            },
            data: notification.data || {},
        };

        const response = await admin.messaging().sendMulticast(message);
        console.log(`✅ Sent ${response.successCount} notifications successfully`);
        return response;
    } catch (error) {
        console.error('❌ Error sending multicast notification:', error);
        throw error;
    }
};

module.exports = {
    initializeFirebase,
    getFirebaseApp,
    sendPushNotification,
    sendMulticastNotification,
};
