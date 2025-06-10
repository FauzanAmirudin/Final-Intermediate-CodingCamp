// Import CSS
import "../styles/styles.css";

// Import modules
import { Router } from "./router/router.js";
import { HomeView } from "./views/home-view.js";
import { AddStoryView } from "./views/add-story-view.js";
import { LoginView } from "./views/login-view.js";
import { RegisterView } from "./views/register-view.js";
import { AuthUtil } from "./utils/auth.js";

class App {
  constructor() {
    this.router = new Router();
    this.currentView = null;
    this.init();
    this.setupSkipToContent();
  }

  init() {
    this.setupRoutes();
    this.setupNavigation();
    this.setupAuthCheck();

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason);
    });

    this.router.handleRoute();
  }

  setupRoutes() {
    this.router.addRoute("/home", () => this.renderHome());
    this.router.addRoute("/add", () => this.renderAddStory());
    this.router.addRoute("/login", () => this.renderLogin());
    this.router.addRoute("/register", () => this.renderRegister());
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
      const protectedRoutes = ["/add"];

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

  logout() {
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
