// Import CSS
import "../styles/styles.css";

// Import modules
import { Router } from "./router/router.js";
import { HomeView } from "./views/home-view.js";
import { AddStoryView } from "./views/add-story-view.js";
import { LoginView } from "./views/login-view.js";
import { RegisterView } from "./views/register-view.js";
import { AuthUtil } from "./utils/auth.js";
import dbService from "./db.js";
import pushService from "./push.js";
import { FavoritesView } from "./views/favorites-view.js";
import { SavedStoriesView } from "./views/saved-stories-view.js";

class App {
  constructor() {
    this.router = new Router();
    this.currentView = null;
    this.deferredPrompt = null;
    this.init();
    this.setupSkipToContent();
    this.setupInstallPrompt();
  }

  async init() {
    // Initialize IndexedDB
    try {
      await dbService.init();
      console.log("IndexedDB initialized successfully");
    } catch (error) {
      console.error("Failed to initialize IndexedDB:", error);
    }

    // Register service worker
    this.registerServiceWorker();

    // Setup routes and navigation
    this.setupRoutes();
    this.setupNavigation();
    this.setupAuthCheck();

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
    });

    // Handle route
    this.router.handleRoute();
  }

  setupInstallPrompt() {
    // Capture the install prompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      this.deferredPrompt = e;

      // Show the install button after a delay to ensure UI is ready
      setTimeout(() => {
        this.showInstallButton();
      }, 3000);
    });

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      console.log("PWA was installed");
      this.hideInstallButton();
    });
  }

  showInstallButton() {
    // Only show if we have the deferred prompt and user is on home page
    if (!this.deferredPrompt) return;

    const currentRoute = this.router.getCurrentRoute();
    if (currentRoute !== "/home") return;

    // Check if install button already exists
    if (document.getElementById("pwa-install-button")) return;

    // Create install button
    const installBanner = document.createElement("div");
    installBanner.className = "install-banner";
    installBanner.id = "pwa-install-banner";
    installBanner.innerHTML = `
      <div class="install-content">
        <p>Install Story App for a better experience!</p>
        <div class="install-actions">
          <button id="pwa-install-button" class="btn btn-primary">Install</button>
          <button id="pwa-dismiss-button" class="btn btn-secondary">Not Now</button>
        </div>
      </div>
    `;

    // Add to page
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.prepend(installBanner);

      // Add event listeners
      document
        .getElementById("pwa-install-button")
        .addEventListener("click", this.installPWA.bind(this));
      document
        .getElementById("pwa-dismiss-button")
        .addEventListener("click", this.hideInstallButton.bind(this));
    }
  }

  hideInstallButton() {
    const banner = document.getElementById("pwa-install-banner");
    if (banner) {
      banner.remove();
    }
  }

  async installPWA() {
    if (!this.deferredPrompt) return;

    // Show the prompt
    this.deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await this.deferredPrompt.userChoice;
    console.log("User installation choice:", choiceResult.outcome);

    // Clear the saved prompt as it can only be used once
    this.deferredPrompt = null;

    // Hide the install button
    this.hideInstallButton();
  }

  registerServiceWorker() {
    window.addEventListener("load", () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/service-worker.js").then(
          (registration) => {
            console.log(
              "Service Worker registered with scope:",
              registration.scope
            );

            // Check if user is authenticated, then subscribe to push notifications
            if (AuthUtil.isAuthenticated()) {
              this.subscribeToPushNotifications();
            }
          },
          (error) => {
            console.error("Service Worker registration failed:", error);
          }
        );
      } else {
        console.warn("Service workers are not supported in this browser");
      }
    });
  }

  async subscribeToPushNotifications() {
    try {
      const pushSupport = await pushService.checkPushSupport();
      if (pushSupport.supported && pushSupport.permission === "granted") {
        await pushService.subscribeToPushNotifications();
        console.log("Successfully subscribed to push notifications");
      } else if (pushSupport.supported && pushSupport.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          await pushService.subscribeToPushNotifications();
          console.log(
            "Successfully subscribed to push notifications after permission grant"
          );
        }
      }
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
    }
  }

  setupRoutes() {
    this.router.addRoute("/home", () => this.renderHome());
    this.router.addRoute("/add", () => this.renderAddStory());
    this.router.addRoute("/login", () => this.renderLogin());
    this.router.addRoute("/register", () => this.renderRegister());
    this.router.addRoute("/favorites", () => this.renderFavorites());
    this.router.addRoute("/saved", () => this.renderSavedStories());
  }

  setupNavigation() {
    window.addEventListener("hashchange", () => {
      this.updateActiveNavLink();
      this.updateNavbar();
    });

    this.updateActiveNavLink();
    this.updateNavbar();
  }

  setupAuthCheck() {
    window.addEventListener("hashchange", () => {
      const currentRoute = this.router.getCurrentRoute();
      const protectedRoutes = ["/add", "/favorites", "/saved"];

      if (
        protectedRoutes.includes(currentRoute) &&
        !AuthUtil.isAuthenticated()
      ) {
        this.router.navigate("/login");
      }
    });
  }

  setupSkipToContent() {
    const skipLink = document.getElementById("skip-link");
    const mainContent = document.getElementById("main-content");

    if (skipLink && mainContent) {
      skipLink.addEventListener("click", (e) => {
        e.preventDefault();
        mainContent.focus();
      });
    }
  }

  updateNavbar() {
    const isAuthenticated = AuthUtil.isAuthenticated();
    const navMenu = document.querySelector(".nav-menu");
    const userInfo = AuthUtil.getUserInfo();

    if (isAuthenticated && userInfo) {
      navMenu.innerHTML = `
        <li><a href="#/home" class="nav-link">Home</a></li>
        <li><a href="#/add" class="nav-link">Add Story</a></li>
        <li><a href="#/favorites" class="nav-link">Favorites</a></li>
        <li><a href="#/saved" class="nav-link">Saved Stories</a></li>
        <li class="user-menu">
          <span class="user-name">Hello, ${userInfo.name}</span>
          <button class="btn btn-secondary btn-small" onclick="window.app.logout()">Logout</button>
        </li>
      `;
    } else {
      navMenu.innerHTML = `
        <li><a href="#/home" class="nav-link">Home</a></li>
        <li><a href="#/login" class="nav-link">Login</a></li>
        <li><a href="#/register" class="nav-link">Register</a></li>
      `;
    }
  }

  updateActiveNavLink() {
    const currentRoute = this.router.getCurrentRoute();
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href === `#${currentRoute}`) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      }
    });
  }

  renderHome() {
    this.destroyCurrentView();
    this.currentView = new HomeView();
    this.currentView.render();

    // Check if we should show install prompt on home page
    if (this.deferredPrompt) {
      this.showInstallButton();
    }
  }

  renderAddStory() {
    if (!AuthUtil.isAuthenticated()) {
      this.router.navigate("/login");
      return;
    }

    this.destroyCurrentView();
    this.currentView = new AddStoryView(this.router);
    this.currentView.render();
  }

  renderLogin() {
    if (AuthUtil.isAuthenticated()) {
      this.router.navigate("/home");
      return;
    }

    this.destroyCurrentView();
    this.currentView = new LoginView(this.router);
    this.currentView.render();
  }

  renderRegister() {
    if (AuthUtil.isAuthenticated()) {
      this.router.navigate("/home");
      return;
    }

    this.destroyCurrentView();
    this.currentView = new RegisterView(this.router);
    this.currentView.render();
  }

  renderFavorites() {
    if (!AuthUtil.isAuthenticated()) {
      this.router.navigate("/login");
      return;
    }

    this.destroyCurrentView();
    this.currentView = new FavoritesView();
    this.currentView.render();
  }

  renderSavedStories() {
    if (!AuthUtil.isAuthenticated()) {
      this.router.navigate("/login");
      return;
    }

    this.destroyCurrentView();
    this.currentView = new SavedStoriesView();
    this.currentView.render();
  }

  async logout() {
    try {
      // Unsubscribe from push notifications
      await pushService.unsubscribeFromPushNotifications();
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error);
    }

    AuthUtil.logout();
    this.updateNavbar();
    this.router.navigate("/login");
  }

  destroyCurrentView() {
    if (this.currentView && typeof this.currentView.destroy === "function") {
      this.currentView.destroy();
      this.currentView = null;
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  console.log("App initializing...");
  window.app = new App();
});

// Handle page unload to clean up resources
window.addEventListener("beforeunload", () => {
  const videos = document.querySelectorAll("video");
  videos.forEach((video) => {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach((track) => track.stop());
    }
  });
});
