class AuthUtil {
  static setToken(token) {
    localStorage.setItem("authToken", token);
  }

  static getToken() {
    return localStorage.getItem("authToken");
  }

  static removeToken() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userInfo");
  }

  static setUserInfo(userInfo) {
    localStorage.setItem("userInfo", JSON.stringify(userInfo));
  }

  static getUserInfo() {
    const userInfo = localStorage.getItem("userInfo");
    return userInfo ? JSON.parse(userInfo) : null;
  }

  static isAuthenticated() {
    return !!this.getToken();
  }

  static logout() {
    this.removeToken();
    window.location.hash = "/login";
  }
}

export { AuthUtil };
