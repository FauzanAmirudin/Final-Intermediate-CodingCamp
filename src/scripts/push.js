import { CONFIG } from "./utils/config.js";
import { AuthUtil } from "./utils/auth.js";

class PushNotificationService {
  constructor() {
    // VAPID public key from the Dicoding API
    this.publicVapidKey =
      "BN7-r0Svv7CsTi18-OPYtJLVW0bfuZ1x1UtrygczKjennA_qs7OWmgOewcuYSYF3Gc_mPbqsDh2YoGCDPL0W7Yo";
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
        console.log("Service Worker registered successfully:", registration);
        return registration;
      } catch (error) {
        console.error("Service Worker registration failed:", error);
        throw error;
      }
    } else {
      throw new Error("Service Worker not supported in this browser");
    }
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications() {
    try {
      // Register service worker first
      const registration = await navigator.serviceWorker.ready;

      // Check if push notification is supported
      if (!("PushManager" in window)) {
        throw new Error("Push notifications not supported in this browser");
      }

      // Check permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied");
      }

      // Get existing subscription or create a new one
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create a new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey),
        });

        console.log("Created new push subscription:", subscription);
      } else {
        console.log("Using existing push subscription:", subscription);
      }

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
        // Remove subscription from server first
        await this.removeSubscriptionFromServer(subscription);

        // Then unsubscribe locally
        const result = await subscription.unsubscribe();
        console.log("Unsubscribed from push notifications:", result);
        return result;
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
      // Check if user is authenticated
      if (!AuthUtil.isAuthenticated()) {
        console.warn(
          "User not authenticated, cannot send subscription to server"
        );
        return false;
      }

      const token = AuthUtil.getToken();

      // Prepare subscription data in the format expected by Dicoding API
      const p256dh = btoa(
        String.fromCharCode.apply(
          null,
          new Uint8Array(subscription.getKey("p256dh"))
        )
      );
      const auth = btoa(
        String.fromCharCode.apply(
          null,
          new Uint8Array(subscription.getKey("auth"))
        )
      );

      console.log("Sending subscription to server with data:", {
        endpoint: subscription.endpoint,
        p256dh,
        auth,
      });

      const response = await fetch(`${CONFIG.API_BASE_URL}/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh,
          auth,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Server response error:", data);
        throw new Error(
          data.message || "Failed to send subscription to server"
        );
      }

      const result = await response.json();
      console.log("Subscription sent to server successfully:", result);
      return result;
    } catch (error) {
      console.error("Error sending subscription to server:", error);
      throw error;
    }
  }

  // Remove subscription from server
  async removeSubscriptionFromServer(subscription) {
    try {
      // Check if user is authenticated
      if (!AuthUtil.isAuthenticated()) {
        console.warn(
          "User not authenticated, cannot remove subscription from server"
        );
        return false;
      }

      const token = AuthUtil.getToken();

      const response = await fetch(`${CONFIG.API_BASE_URL}/push`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.message || "Failed to remove subscription from server"
        );
      }

      const result = await response.json();
      console.log("Subscription removed from server successfully:", result);
      return result;
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

    const permission = Notification.permission;

    if (permission === "granted") {
      return {
        supported: true,
        message: "Push notifications are supported and enabled",
        permission: permission,
      };
    } else if (permission === "denied") {
      return {
        supported: false,
        message: "Notification permission denied",
        permission: permission,
      };
    } else {
      return {
        supported: true,
        message: "Push notifications are supported but not enabled yet",
        permission: permission,
      };
    }
  }
}

// Export push notification service instance
const pushService = new PushNotificationService();
export default pushService;
