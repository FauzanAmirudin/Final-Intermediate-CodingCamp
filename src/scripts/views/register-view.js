import { StoryAPI } from "../api/story-api.js";

class RegisterView {
  constructor(router) {
    this.router = router;
  }

  render() {
    const container = document.getElementById("page-container");
    container.innerHTML = `
            <div class="page">
                <section class="auth-section">
                    <div class="auth-container">
                        <h1>Register to Story App</h1>
                        <form id="register-form" class="form-container">
                            <div class="form-group">
                                <label for="register-name" class="form-label">Full Name *</label>
                                <input type="text" 
                                       id="register-name" 
                                       name="name" 
                                       class="form-input" 
                                       required
                                       placeholder="Enter your full name">
                                <div class="form-error" id="name-error"></div>
                            </div>

                            <div class="form-group">
                                <label for="register-email" class="form-label">Email *</label>
                                <input type="email" 
                                       id="register-email" 
                                       name="email" 
                                       class="form-input" 
                                       required
                                       placeholder="Enter your email">
                                <div class="form-error" id="email-error"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="register-password" class="form-label">Password *</label>
                                <input type="password" 
                                       id="register-password" 
                                       name="password" 
                                       class="form-input" 
                                       required
                                       minlength="8"
                                       placeholder="Minimum 8 characters">
                                <small class="form-help">Password must be at least 8 characters</small>
                                <div class="form-error" id="password-error"></div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary" id="register-btn">
                                    <span class="btn-text">Register</span>
                                    <span class="btn-loading" style="display: none;">
                                        <span class="loading-spinner small"></span>
                                        Creating account...
                                    </span>
                                </button>
                            </div>
                            
                            <div id="register-message"></div>
                        </form>
                        
                        <div class="auth-switch">
                            <p>Already have an account? <a href="#/login" class="link">Login here</a></p>
                        </div>
                    </div>
                </section>
            </div>
        `;

    this.initializeForm();
  }

  initializeForm() {
    const form = document.getElementById("register-form");
    form.addEventListener("submit", (e) => this.handleRegister(e));
  }

  async handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById("register-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;

    if (!name || !email || !password) {
      this.showMessage("Please fill in all fields", "error");
      return;
    }

    if (password.length < 8) {
      this.showMessage("Password must be at least 8 characters", "error");
      return;
    }

    const registerBtn = document.getElementById("register-btn");
    const btnText = registerBtn.querySelector(".btn-text");
    const btnLoading = registerBtn.querySelector(".btn-loading");

    registerBtn.disabled = true;
    btnText.style.display = "none";
    btnLoading.style.display = "inline-flex";

    try {
      const result = await StoryAPI.register({ name, email, password });

      if (result.error === false) {
        this.showMessage(
          "Registration successful! Please login to continue.",
          "success"
        );
        setTimeout(() => {
          this.router.navigate("/login");
        }, 2000);
      } else {
        this.showMessage(result.message || "Registration failed", "error");
      }
    } catch (error) {
      console.error("Registration error:", error);
      this.showMessage(error.message || "Registration failed", "error");
    } finally {
      registerBtn.disabled = false;
      btnText.style.display = "inline";
      btnLoading.style.display = "none";
    }
  }

  showMessage(message, type) {
    const messageDiv = document.getElementById("register-message");
    messageDiv.className = `form-message ${type}`;
    messageDiv.textContent = message;
  }
}

export { RegisterView };
