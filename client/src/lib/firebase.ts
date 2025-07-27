import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { apiRequest } from './queryClient';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'sports-booking-dev',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.FIREBASE_MEASUREMENT_ID,
};

class FirebaseService {
  private app: any = null;
  private messaging: any = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Only initialize Firebase if we have the required config
      if (firebaseConfig.projectId && firebaseConfig.apiKey) {
        this.app = initializeApp(firebaseConfig);
        
        // Initialize messaging only in browser environment
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          this.messaging = getMessaging(this.app);
          this.isInitialized = true;
        }
      } else {
        console.warn('Firebase configuration is incomplete. Push notifications will not work.');
      }
    } catch (error) {
      console.warn('Failed to initialize Firebase:', error.message);
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!this.isInitialized) {
      console.warn('Firebase is not initialized');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async getFCMToken(): Promise<string | null> {
    if (!this.isInitialized || !this.messaging) {
      console.warn('Firebase messaging is not initialized');
      return null;
    }

    try {
      // Request permission first
      const hasPermission = await this.requestNotificationPermission();
      if (!hasPermission) {
        console.warn('Notification permission denied');
        return null;
      }

      // Get FCM token
      const token = await getToken(this.messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY,
      });

      if (token) {
        console.log('FCM Token:', token);
        return token;
      } else {
        console.warn('No FCM token available');
        return null;
      }
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  async updateFCMTokenOnServer(): Promise<void> {
    try {
      const token = await this.getFCMToken();
      if (token) {
        await apiRequest('POST', '/api/fcm-token', { token });
        console.log('FCM token updated on server');
      }
    } catch (error) {
      console.error('Error updating FCM token on server:', error);
    }
  }

  setupForegroundMessageHandler(callback?: (payload: any) => void): void {
    if (!this.isInitialized || !this.messaging) {
      console.warn('Firebase messaging is not initialized');
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Default handling - show browser notification
      if (payload.notification) {
        this.showBrowserNotification(
          payload.notification.title || 'Sports Booking Notification',
          payload.notification.body || 'You have a new notification',
          payload.data
        );
      }

      // Call custom callback if provided
      if (callback) {
        callback(payload);
      }
    });
  }

  private showBrowserNotification(title: string, body: string, data?: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const options: NotificationOptions = {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data,
        tag: 'sports-booking',
        requireInteraction: true,
      };

      const notification = new Notification(title, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
        
        // Handle notification click based on data
        if (data?.type === 'booking_confirmed' && data?.bookingId) {
          // Navigate to booking details
          window.location.href = `/booking?id=${data.bookingId}`;
        }
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  // Subscribe to topic for organization-wide notifications
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      const token = await this.getFCMToken();
      if (token) {
        // This would typically be done server-side
        console.log(`Subscribing to topic: ${topic}`);
        // Implementation would depend on your backend setup
      }
    } catch (error) {
      console.error('Error subscribing to topic:', error);
    }
  }

  // Send notification type definitions
  getNotificationTypes() {
    return {
      BOOKING_CONFIRMED: 'booking_confirmed',
      BOOKING_CANCELLED: 'booking_cancelled',
      BOOKING_REMINDER: 'booking_reminder',
      PAYMENT_SUCCESS: 'payment_success',
      PAYMENT_FAILED: 'payment_failed',
      SLOT_AVAILABLE: 'slot_available',
      ORGANIZATION_UPDATE: 'organization_update',
      MAINTENANCE_NOTICE: 'maintenance_notice',
    };
  }

  // Helper method to check if notifications are supported
  isNotificationSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  }

  // Get current notification permission status
  getNotificationPermission(): NotificationPermission {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  }

  // Initialize service worker for background notifications
  async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
}

// Create singleton instance
export const firebaseService = new FirebaseService();

// Export notification helper functions
export const requestNotificationPermission = () => firebaseService.requestNotificationPermission();
export const getFCMToken = () => firebaseService.getFCMToken();
export const updateFCMTokenOnServer = () => firebaseService.updateFCMTokenOnServer();
export const setupForegroundMessageHandler = (callback?: (payload: any) => void) => 
  firebaseService.setupForegroundMessageHandler(callback);
export const subscribeToTopic = (topic: string) => firebaseService.subscribeToTopic(topic);
export const isNotificationSupported = () => firebaseService.isNotificationSupported();
export const getNotificationPermission = () => firebaseService.getNotificationPermission();

// Auto-initialize service worker and setup FCM token on app load
export const initializeFirebaseMessaging = async () => {
  await firebaseService.initializeServiceWorker();
  await firebaseService.updateFCMTokenOnServer();
  firebaseService.setupForegroundMessageHandler();
};

export default firebaseService;
