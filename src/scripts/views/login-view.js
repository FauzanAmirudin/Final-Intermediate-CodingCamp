import { StoryAPI } from "../api/story-api.js";
import { AuthUtil } from "../utils/auth.js";

class LoginView {
  constructor(router) {
    this.router = router;
  }

  render() {
    const container = document.getElementById("page-container");
    container.innerHTML = `
            <div class="page">
                <section class="auth-section">
                    <div class="auth-container">
                        <h1>Login to Story App</h1>
                        <form id="login-form" class="form-container">
                            <div class="form-group">
                                <label for="login-email" class="form-label">Email *</label>
                                <input type="email" 
                                       id="login-email" 
                                       name="email" 
                                       class="form-input" 
                                       required
                                       placeholder="Enter your email">
                                <div class="form-error" id="email-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="login-password" class="form-label">Password *</label>
                                <input type="password" 
                                       id="login-password" 
                                       name="password" 
                                       class="form-input" 
                                       required
                                       placeholder="Enter your password">
                                <div class="form-error" id="password-error"></div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary" id="login-btn">
                                    <span class="btn-text">Login</span>
                                    <span class="btn-loading" style="display: none;">
                                        <span class="loading-spinner small"></span>
                                        Logging in...
                                    </span>
                                </button>
                            </div>
                            
                            <div id="login-message"></div>
                        </form>
                        
                        <div class="auth-switch">
                            <p>Don't have an account? <a href="#/register" class="link">Register here</a></p>
                        </div>
                    </div>
                </section>
            </div>
        `;

    this.initializeForm();
  }

  initializeForm() {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", (e) => this.handleLogin(e));
  }

  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      this.showMessage("Please fill in all fields", "error");
      return;
    }

    const loginBtn = document.getElementById("login-btn");
    const btnText = loginBtn.querySelector(".btn-text");
    const btnLoading = loginBtn.querySelector(".btn-loading");

    loginBtn.disabled = true;
    btnText.style.display = "none";
    btnLoading.style.display = "inline-flex";

    try {
      const result = await StoryAPI.login({ email, password });

      if (result.error === false && result.loginResult) {
        this.showMessage("Login successful! Redirecting...", "success");
        setTimeout(() => {
          this.router.navigate("/home");
          if (window.app && window.app.updateNavbar) {
            window.app.updateNavbar();
          }
        }, 1500);
      } else {
        this.showMessage(result.message || "Login failed", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      this.showMessage(error.message || "Login failed", "error");
    } finally {
      loginBtn.disabled = false;
      btnText.style.display = "inline";
      btnLoading.style.display = "none";
    }
  }

  showMessage(message, type) {
    const messageDiv = document.getElementById("login-message");
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
  }
}

export { LoginView };
