class PushNotificationService {
  constructor() {
    // VAPID keys from the API
    this.publicVapidKey =
      "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";
    this.privateVapidKey = "VAPID_PRIVATE_KEY"; // This should be kept secure on the server side
  }

  // Convert VAPID key to Uint8Array
  urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Register service worker
  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          "/service-worker.js"
        );
        console.log("Service Worker registered successfully");
        return registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
        throw error;
      }
    }
    throw new Error("Service Worker not supported");
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications() {
    try {
      const registration = await this.registerServiceWorker();

      // Check if push notification is supported
      if (!("PushManager" in window)) {
        throw new Error("Push notifications not supported");
      }

      // Check permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Get push subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey),
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error("Error subscribing to push notifications:", error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.removeSubscriptionFromServer(subscription);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
      throw error;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/notifications/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${AuthUtil.getToken()}`,
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new ApiError(
          data.message || "Failed to send subscription to server",
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending subscription to server:", error);
      throw error;
    }
  }

  // Remove subscription from server
  async removeSubscriptionFromServer(subscription) {
    try {
      const response = await fetch(
        `${CONFIG.API_BASE_URL}/notifications/subscribe`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${AuthUtil.getToken()}`,
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new ApiError(
          data.message || "Failed to remove subscription from server",
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error removing subscription from server:", error);
      throw error;
    }
  }

  // Check if push notification is supported and permission is granted
  async checkPushSupport() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return {
        supported: false,
        message: "Push notifications are not supported in your browser",
      };
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return {
        supported: false,
        message: "Notification permission denied",
      };
    }

    return {
      supported: true,
      message: "Push notifications are supported and enabled",
    };
  }
}

// Export push notification service instance
const pushService = new PushNotificationService();
export default pushService;
