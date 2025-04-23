import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../firebase/config';

// Initialize Firebase Cloud Messaging
const messaging = getMessaging(app);

// Function to request permission and get token
export const requestNotificationPermission = async () => {
  try {
    // Check if notification permission is already granted
    if (Notification.permission === 'granted') {
      return await getDeviceToken();
    }
    
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      return await getDeviceToken();
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Function to get the FCM token
const getDeviceToken = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
    });
    
    if (currentToken) {
      console.log('Device token obtained:', currentToken);
      
      // Store token locally for reference
      localStorage.setItem('fcmToken', currentToken);
      
      return currentToken;
    } else {
      console.log('No token available. Request permission first.');
      return null;
    }
  } catch (error) {
    console.error('Error getting device token:', error);
    return null;
  }
};

// Register token with backend
export const registerDeviceToken = async (userId, token) => {
  if (!token) return;
  
  try {
    // Make an API call to your backend to register this token
    const response = await fetch('/api/register-device', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        token,
        platform: navigator.userAgent
      }),
    });
    
    if (response.ok) {
      console.log('Device token registered with backend.');
    } else {
      console.error('Failed to register device token with backend.');
    }
  } catch (error) {
    console.error('Error registering device token:', error);
  }
};

// Set up foreground notification handler
export const setupForegroundNotifications = () => {
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground:', payload);
    
    // Create and display a custom notification
    if (payload.notification) {
      const { title, body } = payload.notification;
      
      // Display custom notification
      const notificationOptions = {
        body,
        icon: '/icons/logo-192.png',
        badge: '/icons/badge-96.png',
        data: payload.data,
        vibrate: [200, 100, 200],
        requireInteraction: true
      };
      
      // Show notification
      new Notification(title, notificationOptions);
    }
  });
};

// Notification-related utility functions
export const notificationUtils = {
  // Check if browser supports notifications
  isSupported: () => 'Notification' in window && 'serviceWorker' in navigator,
  
  // Check if notifications are enabled
  isEnabled: () => Notification.permission === 'granted',
  
  // Get current permission status
  permissionStatus: () => Notification.permission
}; 