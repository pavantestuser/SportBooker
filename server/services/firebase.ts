import admin from 'firebase-admin';

class FirebaseService {
  private initialized = false;

  private initialize() {
    if (this.initialized) return;

    try {
      // Initialize Firebase Admin SDK
      // In production, use service account key file or environment variables
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : null;

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID
        });
      } else {
        // For development - Firebase will use default credentials
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || 'sports-booking-dev'
        });
      }

      this.initialized = true;
    } catch (error) {
      console.warn('Firebase initialization failed:', error.message);
      // Continue without Firebase notifications
    }
  }

  async sendNotification(fcmToken: string, notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.initialized) {
      console.warn('Firebase not initialized, skipping notification');
      return;
    }

    try {
      const message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#007BFF'
          }
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default'
            }
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log('Notification sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  async sendBulkNotifications(tokens: string[], notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.initialized) {
      console.warn('Firebase not initialized, skipping bulk notifications');
      return;
    }

    try {
      const message = {
        tokens: tokens,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#007BFF'
          }
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default'
            }
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Bulk notifications sent:', response);
      return response;
    } catch (error) {
      console.error('Failed to send bulk notifications:', error);
      throw error;
    }
  }

  async sendTopicNotification(topic: string, notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.initialized) {
      console.warn('Firebase not initialized, skipping topic notification');
      return;
    }

    try {
      const message = {
        topic: topic,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: notification.data || {}
      };

      const response = await admin.messaging().send(message);
      console.log('Topic notification sent:', response);
      return response;
    } catch (error) {
      console.error('Failed to send topic notification:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
