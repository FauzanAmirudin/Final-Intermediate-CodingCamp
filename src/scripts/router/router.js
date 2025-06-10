class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.init();
  }

  init() {
    window.addEventListener("hashchange", () => this.handleRoute());
    window.addEventListener("load", () => this.handleRoute());
  }

  addRoute(path, handler) {
    this.routes[path] = handler;
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || "/home";
    const route = this.routes[hash] || this.routes["/home"];

    if (route && typeof route === "function") {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          route();
        });
      } else {
        route();
      }
    }
  }

  navigate(path) {
    window.location.hash = path;
  }

  getCurrentRoute() {
    return window.location.hash.slice(1) || "/home";
  }
}

export { Router };
